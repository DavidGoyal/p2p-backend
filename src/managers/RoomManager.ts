import { Socket } from "socket.io";
import { User } from "./UserManager";

let GLOBAL_ROOM_ID = 1;

export interface Room {
	user1: User;
	user2: User;
}

export class RoomManager {
	private rooms: Map<string, Room>;

	constructor() {
		this.rooms = new Map<string, Room>();
	}

	addRoom(user1: User, user2: User) {
		const roomID = this.generate().toString();

		this.rooms.set(roomID.toString(), {
			user1,
			user2,
		});

		user1.socket.emit("send-offer", {
			roomID,
		});

		user2.socket.emit("send-offer", {
			roomID,
		});
	}

	onOffer(roomID: string, sdp: string, socket: Socket) {
		const room = this.rooms.get(roomID);
		if (!room) {
			return;
		}

		const receivingUser =
			room.user1.socket.id === socket.id ? room.user2 : room.user1;
		receivingUser.socket.emit("offer", {
			sdp,
			roomID,
		});
	}

	onAnswer(roomID: string, sdp: string, socket: Socket) {
		const room = this.rooms.get(roomID);
		if (!room) {
			return;
		}

		const receivingUser =
			room.user1.socket.id === socket.id ? room.user2 : room.user1;
		receivingUser.socket.emit("answer", {
			sdp,
			roomID,
		});
	}

	onIceCandidate(
		roomID: string,
		socket: Socket,
		candidate: any,
		type: "sender" | "receiver"
	) {
		const room = this.rooms.get(roomID);
		if (!room) return;

		const otherUser =
			room.user1.socket.id === socket.id ? room.user2 : room.user1;

		otherUser.socket.emit("add-ice-candidate", {
			candidate,
			type,
		});
	}

	generate() {
		return GLOBAL_ROOM_ID++;
	}
}
