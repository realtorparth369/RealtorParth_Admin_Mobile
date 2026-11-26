import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

import {
    getAdminEmail,
    saveAdminEmail,
    removeAdminEmail,
} from "../utils/storage";

/* =========================================================
   TYPES
========================================================= */

type AuthUser = {
    email: string;
};

type AuthContextType = {
    user: AuthUser | null;

    loading: boolean;

    signIn: (
        email: string
    ) => Promise<void>;

    signOut: () => Promise<void>;
};

/* =========================================================
   CONTEXT
========================================================= */

const AuthContext =
    createContext<AuthContextType | undefined>(
        undefined
    );

/* =========================================================
   PROVIDER PROPS
========================================================= */

type AuthProviderProps = {
    children: ReactNode;
};

/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({
    children,
}: AuthProviderProps) {

    const [user, setUser] =
        useState<AuthUser | null>(null);

    const [loading, setLoading] =
        useState(true);

    /* =======================================================
       LOAD STORED USER
    ======================================================= */

    useEffect(() => {

        async function loadUser() {

            try {

                const email =
                    await getAdminEmail();

                if (email) {

                    setUser({
                        email,
                    });

                } else {

                    setUser(null);

                }

            } catch (error) {

                console.error(
                    "Failed to load admin:",
                    error
                );

                setUser(null);

            } finally {

                setLoading(false);

            }
        }

        loadUser();

    }, []);

    /* =======================================================
       SIGN IN
    ======================================================= */

    const signIn = async (
        email: string
    ) => {

        const cleanEmail =
            email.trim();

        if (!cleanEmail) {

            throw new Error(
                "Admin email is required."
            );

        }

        await saveAdminEmail(
            cleanEmail
        );

        setUser({
            email: cleanEmail,
        });

    };

    /* =======================================================
       SIGN OUT
    ======================================================= */

    const signOut = async () => {

        try {

            await removeAdminEmail();

        } finally {

            setUser(null);

        }

    };

    /* =======================================================
       PROVIDER
    ======================================================= */

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

/* =========================================================
   USE AUTH
========================================================= */

export function useAuth() {

    const context =
        useContext(AuthContext);

    if (!context) {

        throw new Error(
            "useAuth must be used inside AuthProvider"
        );

    }

    return context;
}