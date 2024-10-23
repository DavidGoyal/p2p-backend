import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
	name: string;
	socket: Socket;
}

export class UserManager {
	private users: User[];
	private queue: string[];
	private RoomManager: RoomManager;

	constructor() {
		this.users = [];
		this.queue = [];
		this.RoomManager = new RoomManager();
	}

	addUser(name: string, socket: Socket) {
		this.users.push({ name, socket });
		this.queue.push(socket.id);
		socket.emit("lobby");
		this.clearQueue();
		this.initHandler(socket);
	}

	removeUser(socketID: string) {
		this.users = this.users.filter((user) => user.socket.id !== socketID);
		this.queue = this.queue.filter((id) => id !== socketID);
	}

	clearQueue() {
		if (this.queue.length < 2) {
			return;
		}

		const firstUserSocketId = this.queue.pop();
		const secondUserSocketId = this.queue.pop();
		const user1 = this.users.find(
			(user) => user.socket.id === firstUserSocketId
		);
		const user2 = this.users.find(
			(user) => user.socket.id === secondUserSocketId
		);

		if (!user1 || !user2) {
			return;
		}

		console.log("creating room");

		this.RoomManager.addRoom(user1, user2);
		this.clearQueue();
	}

	initHandler(socket: Socket) {
		socket.on("offer", (data) => {
			this.RoomManager.onOffer(data.roomID, data.sdp, socket);
		});

		socket.on("answer", (data) => {
			this.RoomManager.onAnswer(data.roomID, data.sdp, socket);
		});

		socket.on("add-ice-candidate", (data) => {
			this.RoomManager.onIceCandidate(
				data.roomID,
				socket,
				data.candidate,
				data.type
			);
		});
	}
}
