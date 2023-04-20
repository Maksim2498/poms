import User         from "logic/User";

import { OnChange } from "logic/User";

export interface UserIsAdminCheckBoxProps {
    user:      User
    onChange?: OnChange
}