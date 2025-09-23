import { useReplacementRequestStore } from '../store/replacementRequestStore';

const StatusBadge = ({ status, type = 'status' }) => {
    const { getStatusColor, getPriorityColor, getStatusIcon } = useReplacementRequestStore();
    
    const getColor = () => {
        if (type === 'priority') {
            return getPriorityColor(status);
        }
        return getStatusColor(status);
    };

    const getIcon = () => {
        if (type === 'priority') {
            return '';
        }
        return getStatusIcon(status);
    };

    const formatText = (text) => {
        if (!text) return '';
        if (type === 'priority') {
            return text.charAt(0).toUpperCase() + text.slice(1);
        }
        return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Don't render if status is undefined or empty
    if (!status) {
        return null;
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()}`}>
            {getIcon() && <span className="mr-1">{getIcon()}</span>}
            {formatText(status)}
        </span>
    );
};

export default StatusBadge;
