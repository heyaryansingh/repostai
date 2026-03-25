interface UsageMeterProps {
  used: number
  limit: number
}

export function UsageMeter({ used, limit }: UsageMeterProps) {
  const percentage = Math.min((used / limit) * 100, 100)

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">API Requests</span>
        <span className="font-medium">
          {used} / {limit}
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-primary-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Resets on the 1st of each month
      </p>
    </div>
  )
}
