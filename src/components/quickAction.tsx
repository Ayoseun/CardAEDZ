

export function QuickAction({ icon: Icon, label, onClick, color }: any) {
    const colorClasses:any = {
        green: 'bg-green-50 text-green-600 hover:bg-green-100',
        red: 'bg-red-50 text-red-600 hover:bg-red-100',
        indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
    };

    return (
        <button
            onClick={onClick}
            className={`${colorClasses[color]} rounded-xl p-4 transition-all hover:shadow-md flex flex-col items-center space-y-2`}
        >
            <Icon className="w-6 h-6" />
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}