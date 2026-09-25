import type { AccountPermissions } from "../types/AccountPermissions"
import axiosInstance from "./axiosInstance"

export const getUserPermissions = (cb: (permissions: AccountPermissions) => void) => {
    try {
        axiosInstance.get("/permissions").then((data) => {
            if (data.data.permissions) {
                cb(data.data.permissions as AccountPermissions)
                return 
            }

            cb(getDefaultPermissions())
            return
        })
    } catch (error) {
        cb(getDefaultPermissions())
        return
    }
}

const getDefaultPermissions = (): AccountPermissions => {
    return {
        read_directories: false,
        read_files: false,
        create: false,
        change: false,
        delete: false,
        move: false,
        download_files: false,
        upload_files: false,
        rename: false,
        extract: false,
        copy: false,
        read_recovery: false,
        use_recovery: false,
        read_users: false,
        edit_users: false,
        read_logs: false,
        archive: false
    }
}