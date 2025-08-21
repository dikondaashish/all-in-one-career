interface StatusBadgeProps {
  type: 'ats-focus' | 'recruiter-focus' | 'hiring-focus' | 'good' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

export const StatusBadge = ({ type, children, className = '' }: StatusBadgeProps) => {
  const getClasses = () => {
    switch (type) {
      case 'ats-focus':
        return 'bg-gray-900 text-white';
      case 'recruiter-focus':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'hiring-focus':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      case 'good':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'error':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getClasses()} ${className}`}>
      {children}
    </span>
  );
};

export default StatusBadge;
