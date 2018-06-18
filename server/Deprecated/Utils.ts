export function getSocketIdsInRoom(io: any, roomId: string): any {
    return io.nsps['/'].adapter.rooms[roomId] || null;
}

export function getSocketsInRoom(io: SocketIO.Server, roomId: string): SocketIO.Socket[] {
    var socketKeys = Object.keys(getSocketIdsInRoom(io, roomId) || {});

    return socketKeys.map(key => io.sockets.connected[key]);
}

export function isSocketInRoom(io: any, roomId: string, socketId: string): boolean {
    var socketsInRoom = getSocketIdsInRoom(io, roomId);
    return socketsInRoom ? socketsInRoom[socketId] : false;
}