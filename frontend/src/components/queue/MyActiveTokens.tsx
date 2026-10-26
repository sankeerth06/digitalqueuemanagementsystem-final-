import { useMyActiveTokens, useCancelToken } from '../../hooks/useQueue';

export default function MyActiveTokens() {
  const { data, isLoading } = useMyActiveTokens();
  const cancel = useCancelToken();

  if (isLoading) {
    return <p className="text-sm opacity-70">Loading your tokens...</p>;
  }

  if (!data || data.length === 0) {
    return <p className="text-sm opacity-70">You have no active tokens.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Your active tokens ({data.length})
      </h2>

      {data.map(({ token, position, peopleAhead }) => (
        <div
          key={token._id}
          className="rounded-xl border p-4 shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{token.tokenCode}</span>
            <span className="text-xs uppercase px-2 py-1 rounded-full border">
              {token.status}
            </span>
          </div>

          <div className="text-sm space-y-1">
            {position ? <p>Queue position: {position}</p> : null}
            {peopleAhead !== null && peopleAhead !== undefined ? (
              <p>People ahead: {peopleAhead}</p>
            ) : null}
            <p>Estimated wait: {token.estimatedWaitMinutes} min</p>
            {token.counter ? <p>Counter: {token.counter}</p> : null}
            <p>Total: ₹{token.totalAmount}</p>
          </div>

          <ul className="text-sm opacity-80 list-disc pl-5">
            {token.items.map((item, i) => (
              <li key={i}>
                {item.name} × {item.quantity}
              </li>
            ))}
          </ul>

          {token.status === 'waiting' && (
            <button
              onClick={() => cancel.mutate(token._id)}
              disabled={cancel.isPending}
              className="text-sm px-3 py-1 rounded-lg border border-red-500 text-red-600"
            >
              Cancel token
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
