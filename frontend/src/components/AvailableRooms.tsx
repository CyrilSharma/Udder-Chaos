import { useEffect, useState } from 'react';
type Room = { room: string; name: string; players: number };
export function AvailableRooms({
    onJoin,
    disabled,
}: {
    onJoin: (room: string) => void;
    disabled: boolean;
}) {
    const [rooms, setRooms] = useState<Room[]>([]);
    useEffect(() => {
        let disposed = false;
        const load = () => {
            void fetch('/api/rooms')
                .then((r) => r.json())
                .then((data) => {
                    if (!disposed && Array.isArray(data)) setRooms(data);
                })
                .catch(() => {});
        };
        load();
        const timer = setInterval(load, 30_000);
        return () => {
            disposed = true;
            clearInterval(timer);
        };
    }, []);
    if (!rooms.length) return null;
    return (
        <div className="available-rooms">
            <span className="eyebrow">ROOMS</span>
            {rooms.map((room) => (
                <button
                    type="button"
                    key={room.room}
                    disabled={disabled}
                    onClick={() => onJoin(room.room)}
                >
                    <span>
                        {room.name} · {room.room}
                    </span>
                    <span>{room.players}/4</span>
                </button>
            ))}
        </div>
    );
}
