export declare function loginUser(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: any;
        email: any;
        firstName: any;
        lastName: any;
        role: any;
        area: any;
        isActive: any;
    };
}>;
export declare function refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
}>;
export declare function createUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
    area?: string | null;
}): Promise<{
    id: any;
    email: any;
    firstName: any;
    lastName: any;
    role: any;
    area: any;
    isActive: any;
}>;
export declare function updateUser(userId: string, data: {
    firstName?: string;
    lastName?: string;
    role?: string;
    area?: string | null;
    isActive?: boolean;
}): Promise<{
    id: any;
    email: any;
    firstName: any;
    lastName: any;
    role: any;
    area: any;
    isActive: any;
}>;
export declare function deleteUser(userId: string): Promise<void>;
export declare function reactivateUser(userId: string): Promise<void>;
export declare function getAllUsers(page?: number, limit?: number, includeInactive?: boolean): Promise<{
    items: any;
    total: any;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare function getUserById(userId: string): Promise<any>;
//# sourceMappingURL=auth.d.ts.map