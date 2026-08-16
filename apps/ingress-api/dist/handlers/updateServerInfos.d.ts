import { PlayerData } from "@vexonac/types";
import { Socket } from "socket.io";
interface ServerInfos {
    players: PlayerData[];
    slots: number;
}
export declare const updateServerInfos: (socket: Socket, data: ServerInfos) => void;
export {};
//# sourceMappingURL=updateServerInfos.d.ts.map