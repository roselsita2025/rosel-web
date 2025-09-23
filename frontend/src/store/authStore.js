import {create} from "zustand";
import axios from "axios";
import { getRecaptchaToken } from "../utils/recaptcha";

const API_URL= (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/auth";

axios.defaults.withCredentials = true;

export const useAuthStore = create((set, get) => ({
    user:null,
    isAuthenticated:false,
    error:null,
    isLoading:false,
    isCheckingAuth: true,
    message: null,
    otpRequired: false,
    pendingEmail: null,


    signup: async(email, password, name) => {
        set({isLoading:true, error:null});
        try {
            const captchaToken = await getRecaptchaToken("signup");
            const response = await axios.post(`${API_URL}/signup`, {email,password,name, captchaToken, captchaAction: "signup"});
            set({user:response.data.user, isAuthenticated:true, isLoading: false});
        } catch (error) {
            set({error:error.response.data.message || "Error signing up", isLoading: false});
            throw error;
        }
    },

    login: async (email, password) => {
        set({isLoading:true, error:null, otpRequired: false, pendingEmail: null});
        try {
            const captchaToken = await getRecaptchaToken("login");
            const response = await axios.post(`${API_URL}/login`, {email,password, captchaToken, captchaAction: "login"});
            // In OTP flow, backend returns otpRequired and no user yet
            if (response.data.otpRequired) {
                set({ otpRequired: true, pendingEmail: email, isLoading: false, message: response.data.message });
                return response.data;
            }
            set({user:response.data.user, isAuthenticated:true, error:null, isLoading: false});
            return response.data;
        } catch (error) {
            set({error: error.response?.data?.message || "Error logging in", isLoading: false});
            throw error;
        }
    },

    verifyLoginOtp: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const email = get().pendingEmail;
            const response = await axios.post(`${API_URL}/login/verify-otp`, { email, code });
            set({ user: response.data.user, isAuthenticated: true, isLoading: false, otpRequired: false, pendingEmail: null, message: null });
            return response.data;
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.message || "Invalid code" });
            throw error;
        }
    },

    resendLoginOtp: async () => {
        set({ isLoading: true, error: null });
        try {
            const email = get().pendingEmail;
            const response = await axios.post(`${API_URL}/login/resend-otp`, { email });
            set({ isLoading: false, message: response.data.message });
            return response.data;
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.message || "Error resending code" });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null });
		try {
			await axios.post(`${API_URL}/logout`);
			set({ user: null, isAuthenticated: false, error: null, isLoading: false });
		} catch (error) {
			set({ error: "Error logging out", isLoading: false });
			throw error;
		}
    },

    verifyEmail: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/verify-email`, { code });
            set({user:response.data.user, isAuthenticated:true, isLoading: false});
            return response.data;
        } catch (error) {
            set({error:error.response.data.message || "Error verifying email", isLoading: false});
            throw error;
        }
    },

    checkAuth: async () => {
        set({ isCheckingAuth: true, error: null});
        try {
            const response = await axios.get(`${API_URL}/check-auth`);
            set({user:response.data.user, isAuthenticated:true, isCheckingAuth: false});
        } catch (error) {
            // Silently handle authentication check failure for guests
            // This is expected behavior for non-authenticated users
            console.log("Auth check: User not authenticated (guest mode)");
            set({error: null, isCheckingAuth: false, isAuthenticated: false, user: null});
        }
    },

    forgotPassword: async (email) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axios.post(`${API_URL}/forgot-password`, { email });
			set({ message: response.data.message, isLoading: false });
		} catch (error) {
			set({
				isLoading: false,
				error: error.response.data.message || "Error sending reset password email",
			});
			throw error;
		}
    },

    resetPassword: async (token,password) => {
        set({ isLoading: true, error: null });
		try {
			const response = await axios.post(`${API_URL}/reset-password/${token}`, { password });
			set({ message: response.data.message, isLoading: false });
		} catch (error) {
			set({
				isLoading: false,
				error: error.response.data.message || "Error resetting password",
			});
			throw error;
		}
    },

    updateProfile: async (payload) => {
        // payload can include: name, avatarUrl, address fields, phone
        set({ isLoading: true, error: null });
        try {
            const response = await axios.patch(`${API_URL}/update-profile`, payload);
            set({ user: response.data.user, isLoading: false });
            return response.data;
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.message || "Error updating profile" });
            throw error;
        }
    },

    changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.patch(`${API_URL}/change-password`, {
                currentPassword,
                newPassword
            });
            set({ isLoading: false, message: response.data.message });
            return response.data;
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.message || "Error changing password" });
            throw error;
        }
    },

    changeEmail: async (newEmail, currentPassword) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.patch(`${API_URL}/change-email`, {
                newEmail,
                currentPassword
            });
            set({ user: response.data.user, isLoading: false, message: response.data.message });
            return response.data;
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.message || "Error changing email" });
            throw error;
        }
    },
}));
