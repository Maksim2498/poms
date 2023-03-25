import User from "logic/User";

export interface Props {
    user: User
}

export default function Profile(props: Props) {
    return <div className="Profile">
        User profile...
    </div>
}