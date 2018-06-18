import { User } from "./User";

export class UserManager {
    private static userCounter = 0;

    public users: User[] = [];

    public constructor() {

    }

    public addUser(sessionId: string, id: string) {
        var user = new User(sessionId, id, "User" + UserManager.userCounter);
        this.users.push(user);

        UserManager.userCounter++;

        return user;
    }

    public getUserBySessionId(sessionId: string) {
        for (var i = 0; i < this.users.length; i++) {
            var user = this.users[i];
            if (user.sessionId == sessionId) {
                return user;
            }
        }

        return null;
    }

    public getUserById(id: string) {
        for (var user of this.users) {
            if (user.id == id) {
                return user;
            }
        }

        return null;
    }

    public getUserByName(name: string) {
        for (var user of this.users) {
            if (user.name == name) {
                return user;
            }
        }

        return null;
    }
}