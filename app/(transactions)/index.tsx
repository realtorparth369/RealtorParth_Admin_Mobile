import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";

import {
    Archive,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ExternalLink,
    Plus,
    RefreshCw,
    Users,
} from "lucide-react-native";

import { Ionicons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRouter } from "expo-router";

import { useAuth } from "../../contexts/AuthContext";

/* =========================================================
   CONSTANTS
========================================================= */

const API_URL =
    "https://realtorparth.ca";

const CURRENT_TRANSACTION_KEY =
    "currentTransactionId";

const PARTY_STEPS = [
    "Upload Docs",
    "Fintrac",
    "Politically Exposed",
    "CRG",
    "Documents",
];

const TOTAL_STEPS =
    PARTY_STEPS.length;

const REQUEST_TIMEOUT = 15000;

/* =========================================================
   TYPES
========================================================= */

interface TransactionUser {
    id?: string;
    _id?: string;
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
}

interface Transaction {
    id: string;
    name: string;
    property: string;
    status: string;
    createdAt: string;

    progress: number;
    completedSteps: number;
    totalSteps: number;
    totalParties: number;
    completedParties: number;
}

interface Party {
    _id?: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    licenseImage?: string;
    passportImage?: string;
}

interface PartyProgress {
    completed: number;
    total: number;
    percent: number;
    steps: boolean[];
}

interface TransactionProgressResult {
    progress: number;
    completedSteps: number;
    totalSteps: number;
    totalParties: number;
    completedParties: number;
    isComplete: boolean;
}

/* =========================================================
   HELPER
========================================================= */

const getTransactionUserId = (
    user: TransactionUser | null
): string | null => {
    if (!user) {
        return null;
    }

    if (
        typeof user.id === "string" &&
        user.id.trim()
    ) {
        return user.id;
    }

    if (
        typeof user._id === "string" &&
        user._id.trim()
    ) {
        return user._id;
    }

    if (
        typeof user.userId === "string" &&
        user.userId.trim()
    ) {
        return user.userId;
    }

    return null;
};

/* =========================================================
   FETCH JSON WITH TIMEOUT
========================================================= */

const fetchJSON = async (
    url: string,
    options?: RequestInit,
    timeoutMs = REQUEST_TIMEOUT
) => {
    const controller =
        new AbortController();

    const timeout =
        setTimeout(() => {
            controller.abort();
        }, timeoutMs);

    try {
        const response =
            await fetch(url, {
                ...options,
                signal:
                    controller.signal,
            });

        let data: any;

        try {
            data =
                await response.json();
        } catch {
            throw new Error(
                "Invalid server response"
            );
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                    `Error ${response.status}`
            );
        }

        return {
            response,
            data,
        };
    } finally {
        clearTimeout(timeout);
    }
};

/* =========================================================
   CREATED DATE
========================================================= */

const formatCreatedDate = (
    value: any
): string => {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    /*
     * Same display idea as website:
     * en-CA -> YYYY-MM-DD
     */

    return date
        .toLocaleDateString(
            "en-CA"
        );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function TransactionsList() {
    const router =
        useRouter();

    const {
        user,
        loading: authLoading,
    } = useAuth();

    /* =====================================================
       STATE
    ===================================================== */

    const [
        transactionUser,
        setTransactionUser,
    ] =
        useState<TransactionUser | null>(
            null
        );

    const [
        transactions,
        setTransactions,
    ] =
        useState<Transaction[]>([]);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        refreshing,
        setRefreshing,
    ] =
        useState(false);

    const [
        archivingId,
        setArchivingId,
    ] =
        useState<string | null>(
            null
        );

    const [
        errorMessage,
        setErrorMessage,
    ] =
        useState<string | null>(
            null
        );

    const [
        checkingSession,
        setCheckingSession,
    ] =
        useState(true);

    const [
        loadingProgress,
        setLoadingProgress,
    ] =
        useState<
            Record<
                string,
                boolean
            >
        >({});

    /* =====================================================
       RESOLVE TRANSACTION USER
    ===================================================== */

    const resolveTransactionUser =
        useCallback(async () => {
            if (authLoading) {
                return null;
            }

            if (!user?.email) {
                setTransactionUser(
                    null
                );

                setCheckingSession(
                    false
                );

                return null;
            }

            const controller =
                new AbortController();

            const timeout =
                setTimeout(() => {
                    controller.abort();
                }, 10000);

            try {
                setCheckingSession(
                    true
                );

                /*
                 * Use the SAME email as the
                 * currently logged-in Admin.
                 */

                const url =
                    `${API_URL}/api/transactions/check-super-admin/${encodeURIComponent(
                        user.email
                    )}`;

                console.log(
                    "Checking Transaction access:",
                    url
                );

                const res =
                    await fetch(url, {
                        method: "GET",

                        headers: {
                            Accept:
                                "application/json",
                        },

                        signal:
                            controller.signal,
                    });

                let data: any;

                try {
                    data =
                        await res.json();
                } catch {
                    throw new Error(
                        "Invalid server response"
                    );
                }

                console.log(
                    "Transaction access response:",
                    data
                );

                if (!res.ok) {
                    throw new Error(
                        data?.message ||
                            `Error ${res.status}`
                    );
                }

                if (!data?.success) {
                    throw new Error(
                        data?.message ||
                            "Transaction access could not be verified."
                    );
                }

                /*
                 * Same website permission concept.
                 */

                if (
                    !data?.isSuperAdmin
                ) {
                    throw new Error(
                        "This admin account does not have Transaction Panel access."
                    );
                }

                /*
                 * Support different possible
                 * backend response structures.
                 */

                const resolvedUser =
                    data?.user ||
                    data?.transactionUser ||
                    data?.admin ||
                    data;

                const resolvedId =
                    resolvedUser?.id ||
                    resolvedUser?._id ||
                    resolvedUser?.userId;

                if (!resolvedId) {
                    console.error(
                        "Transaction user ID missing. Response:",
                        data
                    );

                    throw new Error(
                        "Transaction user ID was not returned by the server."
                    );
                }

                const normalizedUser:
                    TransactionUser = {
                    ...resolvedUser,

                    id: String(
                        resolvedId
                    ),
                };

                setTransactionUser(
                    normalizedUser
                );

                setErrorMessage(
                    null
                );

                return normalizedUser;
            } catch (
                error: any
            ) {
                console.error(
                    "Resolve Transaction User Error:",
                    error
                );

                setTransactionUser(
                    null
                );

                if (
                    error?.name ===
                    "AbortError"
                ) {
                    setErrorMessage(
                        "Transaction access request timed out."
                    );
                } else if (
                    error?.name ===
                    "TypeError"
                ) {
                    setErrorMessage(
                        "Network error. Please check your internet connection."
                    );
                } else {
                    setErrorMessage(
                        error?.message ||
                            "Unable to verify Transaction Panel access."
                    );
                }

                return null;
            } finally {
                clearTimeout(
                    timeout
                );

                setCheckingSession(
                    false
                );
            }
        }, [
            authLoading,
            user?.email,
        ]);

    /* =====================================================
       GET PARTY PROGRESS
       
       EXACT SAME LOGIC AS WEBSITE
       
       5 STEPS:
       1. Upload Docs
       2. Fintrac
       3. Politically Exposed
       4. CRG
       5. Documents
    ===================================================== */

    const getPartyProgress =
        useCallback(
            async (
                party: Party
            ): Promise<PartyProgress> => {
                if (!party?._id) {
                    return {
                        completed: 0,

                        total:
                            TOTAL_STEPS,

                        percent: 0,

                        steps:
                            Array(
                                TOTAL_STEPS
                            ).fill(
                                false
                            ),
                    };
                }

                try {
                    /*
                     * Same four APIs as website.
                     *
                     * Upload Docs does not need
                     * an API because the website
                     * checks the party images directly.
                     */

                    const [
                        fintracRes,
                        pepRes,
                        crgRes,
                        docsRes,
                    ] =
                        await Promise.all([
                            fetch(
                                `${API_URL}/api/fintracpdf/fintrac/user/${encodeURIComponent(
                                    party._id
                                )}`
                            ),

                            fetch(
                                `${API_URL}/api/fintracpeppdf/pep/user/${encodeURIComponent(
                                    party._id
                                )}`
                            ),

                            fetch(
                                `${API_URL}/api/crgpdf/crg/user/${encodeURIComponent(
                                    party._id
                                )}`
                            ),

                            fetch(
                                `${API_URL}/api/statuspdf/document-status/pdf/${encodeURIComponent(
                                    party._id
                                )}`
                            ),
                        ]);

                    const [
                        fintracData,
                        pepData,
                        crgData,
                        docsData,
                    ] =
                        await Promise.all([
                            fintracRes.json(),
                            pepRes.json(),
                            crgRes.json(),
                            docsRes.json(),
                        ]);

                    /* =========================================
                       DOCUMENT COMPLETION
                    ========================================= */

                    let docCompletion = 0;

                    if (
                        docsData?.data
                    ) {
                        const d =
                            docsData.data;

                        /*
                         * EXACT SAME BUYER DOCUMENTS
                         * AS WEBSITE.
                         */

                        const buyerDocs = [
                            d.EBRAA,
                            d.EBRATDA,
                            d.RPC,
                            d.EBRADA,
                        ];

                        /*
                         * EXACT SAME SELLER DOCUMENTS
                         * AS WEBSITE.
                         */

                        const sellerDocs = [
                            d.SCSAAFA,
                            d.IDMMGOL,
                            d.ESRAA,
                        ];

                        const buyerCompletion =
                            buyerDocs.filter(
                                Boolean
                            ).length /
                            buyerDocs.length;

                        const sellerCompletion =
                            sellerDocs.filter(
                                Boolean
                            ).length /
                            sellerDocs.length;

                        /*
                         * EXACT SAME LOGIC:
                         *
                         * If either side has documents,
                         * use whichever side has the
                         * highest completion.
                         */

                        if (
                            buyerCompletion >
                                0 ||
                            sellerCompletion >
                                0
                        ) {
                            docCompletion =
                                Math.max(
                                    buyerCompletion,
                                    sellerCompletion
                                );
                        }
                    }

                    /* =========================================
                       FIVE PARTY STEPS
                    ========================================= */

                    const steps = [
                        /*
                         * STEP 1
                         *
                         * Upload Docs
                         *
                         * EXACT SAME WEBSITE LOGIC:
                         *
                         * either license OR passport
                         * means the step is complete.
                         */

                        !!(
                            party.licenseImage ||
                            party.passportImage
                        ),

                        /*
                         * STEP 2
                         *
                         * FINTRAC
                         */

                        !!fintracData?.data,

                        /*
                         * STEP 3
                         *
                         * Politically Exposed
                         */

                        !!pepData?.data,

                        /*
                         * STEP 4
                         *
                         * CRG
                         */

                        !!crgData?.data,

                        /*
                         * STEP 5
                         *
                         * Documents
                         *
                         * Requires 100% completion
                         * for whichever side is being
                         * evaluated by the website logic.
                         */

                        docCompletion ===
                            1,
                    ];

                    const completed =
                        steps.filter(
                            Boolean
                        ).length;

                    const percent =
                        Math.round(
                            (
                                completed /
                                TOTAL_STEPS
                            ) * 100
                        );

                    return {
                        completed,

                        total:
                            TOTAL_STEPS,

                        percent,

                        steps,
                    };
                } catch (
                    error
                ) {
                    console.error(
                        "Party progress error:",
                        error
                    );

                    return {
                        completed: 0,

                        total:
                            TOTAL_STEPS,

                        percent: 0,

                        steps:
                            Array(
                                TOTAL_STEPS
                            ).fill(
                                false
                            ),
                    };
                }
            },
            []
        );

    /* =====================================================
       GET TRANSACTION PROGRESS
       
       EXACT SAME LOGIC AS WEBSITE
    ===================================================== */

    const getTransactionProgress =
        useCallback(
            async (
                transactionId: string,
                userId: string
            ): Promise<TransactionProgressResult> => {
                try {
                    const controller =
                        new AbortController();

                    const timeout =
                        setTimeout(
                            () => {
                                controller.abort();
                            },
                            REQUEST_TIMEOUT
                        );

                    const res =
                        await fetch(
                            `${API_URL}/api/transactions/parties/${encodeURIComponent(
                                transactionId
                            )}/${encodeURIComponent(
                                userId
                            )}`,
                            {
                                signal:
                                    controller.signal,
                            }
                        );

                    clearTimeout(
                        timeout
                    );

                    let data: any;

                    try {
                        data =
                            await res.json();
                    } catch {
                        throw new Error(
                            "Invalid server response"
                        );
                    }

                    if (!res.ok) {
                        throw new Error(
                            data?.message ||
                                `Error ${res.status}`
                        );
                    }

                    /*
                     * EXACT SAME CHECK AS WEBSITE.
                     */

                    if (
                        !data?.success ||
                        !Array.isArray(
                            data.parties
                        )
                    ) {
                        return {
                            progress: 0,

                            completedSteps: 0,

                            totalSteps: 0,

                            totalParties: 0,

                            completedParties: 0,

                            isComplete: false,
                        };
                    }

                    const parties:
                        Party[] =
                        data.parties;

                    /* =========================================
                       NO PARTIES
                    ========================================= */

                    if (
                        parties.length ===
                        0
                    ) {
                        return {
                            progress: 0,

                            completedSteps: 0,

                            totalSteps: 0,

                            totalParties: 0,

                            completedParties: 0,

                            isComplete: false,
                        };
                    }

                    /* =========================================
                       GET EVERY PARTY'S PROGRESS
                    ========================================= */

                    const partyProgress =
                        await Promise.all(
                            parties.map(
                                (
                                    party
                                ) =>
                                    getPartyProgress(
                                        party
                                    )
                            )
                        );

                    /* =========================================
                       TOTAL COMPLETED STEPS
                    ========================================= */

                    const totalCompletedSteps =
                        partyProgress.reduce(
                            (
                                sum,
                                item
                            ) =>
                                sum +
                                item.completed,
                            0
                        );

                    /* =========================================
                       TOTAL POSSIBLE STEPS
                    ========================================= */

                    const totalPossibleSteps =
                        parties.length *
                        TOTAL_STEPS;

                    /* =========================================
                       AVERAGE TRANSACTION PROGRESS
                    ========================================= */

                    const averageProgress =
                        totalPossibleSteps >
                        0
                            ? Math.round(
                                  (
                                      totalCompletedSteps /
                                      totalPossibleSteps
                                  ) *
                                      100
                              )
                            : 0;

                    /* =========================================
                       COMPLETED PARTIES
                    ========================================= */

                    const completedParties =
                        partyProgress.filter(
                            (
                                item
                            ) =>
                                item.percent ===
                                100
                        ).length;

                    /* =========================================
                       TRANSACTION COMPLETED ONLY WHEN
                       EVERY PARTY IS 100%
                    ========================================= */

                    const isComplete =
                        parties.length >
                            0 &&
                        completedParties ===
                            parties.length;

                    return {
                        progress:
                            averageProgress,

                        completedSteps:
                            totalCompletedSteps,

                        totalSteps:
                            totalPossibleSteps,

                        totalParties:
                            parties.length,

                        completedParties,

                        isComplete,
                    };
                } catch (
                    error
                ) {
                    console.error(
                        "Transaction progress error:",
                        error
                    );

                    return {
                        progress: 0,

                        completedSteps: 0,

                        totalSteps: 0,

                        totalParties: 0,

                        completedParties: 0,

                        isComplete: false,
                    };
                }
            },
            [
                getPartyProgress,
            ]
        );

    /* =====================================================
       FETCH TRANSACTIONS
    ===================================================== */

    const fetchTransactions =
        useCallback(
            async (
                showRefresh = false,
                suppliedUser?: TransactionUser | null
            ) => {
                const activeUser =
                    suppliedUser ??
                    transactionUser;

                const userId =
                    getTransactionUserId(
                        activeUser
                    );

                if (!userId) {
                    setTransactions(
                        []
                    );

                    setLoading(
                        false
                    );

                    setRefreshing(
                        false
                    );

                    return;
                }

                try {
                    if (
                        showRefresh
                    ) {
                        setRefreshing(
                            true
                        );
                    } else {
                        setLoading(
                            true
                        );
                    }

                    setErrorMessage(
                        null
                    );

                    const url =
                        `${API_URL}/api/transactions/list/${encodeURIComponent(
                            userId
                        )}`;

                    console.log(
                        "Fetching transactions:",
                        url
                    );

                    const controller =
                        new AbortController();

                    const timeout =
                        setTimeout(
                            () => {
                                controller.abort();
                            },
                            REQUEST_TIMEOUT
                        );

                    const res =
                        await fetch(
                            url,
                            {
                                method:
                                    "GET",

                                headers: {
                                    Accept:
                                        "application/json",
                                },

                                signal:
                                    controller.signal,
                            }
                        );

                    clearTimeout(
                        timeout
                    );

                    let data: any;

                    try {
                        data =
                            await res.json();
                    } catch {
                        throw new Error(
                            "Invalid server response"
                        );
                    }

                    if (!res.ok) {
                        throw new Error(
                            data?.message ||
                                `Error ${res.status}`
                        );
                    }

                    if (
                        !data?.success
                    ) {
                        throw new Error(
                            "Failed to fetch transactions"
                        );
                    }

                    /* =========================================
                       BASIC TRANSACTION DATA
                    ========================================= */

                    const mapped:
                        Transaction[] =
                        (
                            data.transactions ||
                            []
                        ).map(
                            (
                                tx: any
                            ) => ({
                                id: String(
                                    tx?._id ??
                                        tx?.id ??
                                        ""
                                ),

                                name:
                                    tx?.name ||
                                    "Untitled Transaction",

                                property:
                                    tx?.propertyAddress ||
                                    "Property address not available",

                                /*
                                 * Initially show In Progress.
                                 *
                                 * Actual status is calculated
                                 * from party progress below.
                                 */

                                status:
                                    "In Progress",

                                createdAt:
                                    formatCreatedDate(
                                        tx?.createdAt
                                    ),

                                progress: 0,

                                completedSteps: 0,

                                totalSteps: 0,

                                totalParties: 0,

                                completedParties: 0,
                            })
                        );

                    setTransactions(
                        mapped
                    );

                    /* =========================================
                       LOAD PROGRESS FOR ALL TRANSACTIONS
                    ========================================= */

                    await Promise.all(
                        mapped.map(
                            async (
                                transaction
                            ) => {
                                setLoadingProgress(
                                    prev => ({
                                        ...prev,

                                        [transaction.id]:
                                            true,
                                    })
                                );

                                const result =
                                    await getTransactionProgress(
                                        transaction.id,
                                        userId
                                    );

                                setTransactions(
                                    previous =>
                                        previous.map(
                                            tx => {
                                                if (
                                                    tx.id !==
                                                    transaction.id
                                                ) {
                                                    return tx;
                                                }

                                                return {
                                                    ...tx,

                                                    progress:
                                                        result.progress,

                                                    completedSteps:
                                                        result.completedSteps,

                                                    totalSteps:
                                                        result.totalSteps,

                                                    totalParties:
                                                        result.totalParties,

                                                    completedParties:
                                                        result.completedParties,

                                                    /*
                                                     * EXACT SAME
                                                     * WEBSITE LOGIC.
                                                     *
                                                     * Do not use
                                                     * tx.status.
                                                     *
                                                     * Completed only
                                                     * when every party
                                                     * is 100%.
                                                     */

                                                    status:
                                                        result.isComplete
                                                            ? "Completed"
                                                            : "In Progress",
                                                };
                                            }
                                        )
                                );

                                setLoadingProgress(
                                    prev => ({
                                        ...prev,

                                        [transaction.id]:
                                            false,
                                    })
                                );
                            }
                        )
                    );
                } catch (
                    error: any
                ) {
                    console.error(
                        "Fetch Transactions Error:",
                        error
                    );

                    if (
                        error?.name ===
                        "AbortError"
                    ) {
                        setErrorMessage(
                            "Request timed out."
                        );
                    } else if (
                        error?.name ===
                        "TypeError"
                    ) {
                        setErrorMessage(
                            "Network error. Please check your internet connection."
                        );
                    } else {
                        setErrorMessage(
                            error?.message ||
                                "Failed to load transactions."
                        );
                    }
                } finally {
                    setLoading(
                        false
                    );

                    setRefreshing(
                        false
                    );
                }
            },
            [
                transactionUser,
                getTransactionProgress,
            ]
        );

    /* =====================================================
       INITIAL SESSION RESOLUTION
    ===================================================== */

    useEffect(() => {
        if (!authLoading) {
            resolveTransactionUser();
        }
    }, [
        authLoading,
        resolveTransactionUser,
    ]);

    /* =====================================================
       FETCH AFTER USER RESOLVED
    ===================================================== */

    useEffect(() => {
        if (
            !checkingSession &&
            transactionUser
        ) {
            fetchTransactions();
        }
    }, [
        checkingSession,
        transactionUser,
        fetchTransactions,
    ]);

    /* =====================================================
       REFRESH
    ===================================================== */

    const handleRefresh =
        async () => {
            setRefreshing(
                true
            );

            /*
             * Re-check current Admin email.
             */

            const resolvedUser =
                await resolveTransactionUser();

            if (!resolvedUser) {
                setRefreshing(
                    false
                );

                return;
            }

            /*
             * Pass resolved user directly.
             *
             * This prevents us from depending
             * on the asynchronous React state
             * update of transactionUser.
             */

            await fetchTransactions(
                true,
                resolvedUser
            );
        };

    /* =====================================================
       CREATE TRANSACTION
    ===================================================== */

    const createTransaction =
        async () => {
            try {
                /*
                 * New transaction must NOT inherit
                 * an existing transaction ID.
                 */

                await AsyncStorage.removeItem(
                    CURRENT_TRANSACTION_KEY
                );
            } catch (
                error
            ) {
                console.error(
                    "Failed to clear transaction ID:",
                    error
                );
            }

            router.push(
                "/(transactions)/new-transaction" as any
            );
        };

    /* =====================================================
       OPEN EXISTING TRANSACTION
    ===================================================== */

    const openTransaction =
        async (
            id: string
        ) => {
            try {
                /*
                 * Save selected transaction.
                 *
                 * New Transaction screen will then
                 * load the existing transaction.
                 */

                await AsyncStorage.setItem(
                    CURRENT_TRANSACTION_KEY,
                    id
                );

                router.push(
                    "/(transactions)/new-transaction" as any
                );
            } catch (
                error
            ) {
                console.error(
                    "Failed to save transaction ID:",
                    error
                );

                Alert.alert(
                    "Error",
                    "Unable to open this transaction."
                );
            }
        };

    /* =====================================================
       ARCHIVE TRANSACTION
    ===================================================== */

    const archiveTransaction =
        (
            id: string
        ) => {
            const userId =
                getTransactionUserId(
                    transactionUser
                );

            if (!userId) {
                Alert.alert(
                    "Login Required",
                    "Transaction user could not be found."
                );

                return;
            }

            Alert.alert(
                "Archive Transaction",
                "Are you sure you want to archive this transaction?",
                [
                    {
                        text: "Cancel",

                        style: "cancel",
                    },

                    {
                        text: "Archive",

                        style: "destructive",

                        onPress:
                            async () => {
                                setArchivingId(
                                    id
                                );

                                try {
                                    const controller =
                                        new AbortController();

                                    const timeout =
                                        setTimeout(
                                            () => {
                                                controller.abort();
                                            },
                                            10000
                                        );

                                    const res =
                                        await fetch(
                                            `${API_URL}/api/transactions/archive/${encodeURIComponent(
                                                id
                                            )}`,
                                            {
                                                method:
                                                    "PUT",

                                                headers: {
                                                    Accept:
                                                        "application/json",

                                                    "Content-Type":
                                                        "application/json",
                                                },

                                                body:
                                                    JSON.stringify(
                                                        {
                                                            userId,
                                                        }
                                                    ),

                                                signal:
                                                    controller.signal,
                                            }
                                        );

                                    clearTimeout(
                                        timeout
                                    );

                                    let data: any;

                                    try {
                                        data =
                                            await res.json();
                                    } catch {
                                        throw new Error(
                                            "Invalid server response"
                                        );
                                    }

                                    if (
                                        !res.ok
                                    ) {
                                        throw new Error(
                                            data?.message ||
                                                `Error ${res.status}`
                                        );
                                    }

                                    if (
                                        !data?.success
                                    ) {
                                        throw new Error(
                                            data?.message ||
                                                "Failed to archive transaction"
                                        );
                                    }

                                    /*
                                     * Remove immediately from
                                     * current transaction list.
                                     */

                                    setTransactions(
                                        previous =>
                                            previous.filter(
                                                tx =>
                                                    tx.id !==
                                                    id
                                            )
                                    );

                                    /*
                                     * Clear current transaction
                                     * if the archived transaction
                                     * was the selected transaction.
                                     */

                                    const currentId =
                                        await AsyncStorage.getItem(
                                            CURRENT_TRANSACTION_KEY
                                        );

                                    if (
                                        currentId ===
                                        id
                                    ) {
                                        await AsyncStorage.removeItem(
                                            CURRENT_TRANSACTION_KEY
                                        );
                                    }

                                    Alert.alert(
                                        "Success",
                                        "Transaction archived successfully."
                                    );
                                } catch (
                                    error: any
                                ) {
                                    console.error(
                                        "Archive Error:",
                                        error
                                    );

                                    if (
                                        error?.name ===
                                        "AbortError"
                                    ) {
                                        Alert.alert(
                                            "Request Timed Out",
                                            "Please try again."
                                        );
                                    } else if (
                                        error?.name ===
                                        "TypeError"
                                    ) {
                                        Alert.alert(
                                            "Network Error",
                                            "Unable to connect to the server."
                                        );
                                    } else {
                                        Alert.alert(
                                            "Error",
                                            error?.message ||
                                                "Server error"
                                        );
                                    }
                                } finally {
                                    setArchivingId(
                                        null
                                    );
                                }
                            },
                    },
                ]
            );
        };

    /* =====================================================
       STATUS STYLE
    ===================================================== */

    const getStatusStyle =
        (
            status: string
        ) => {
            const completed =
                status ===
                "Completed";

            if (completed) {
                return {
                    container:
                        "bg-green-100",

                    text:
                        "text-green-700",

                    iconColor:
                        "#15803d",
                };
            }

            return {
                container:
                    "bg-yellow-100",

                text:
                    "text-yellow-700",

                iconColor:
                    "#a16207",
            };
        };

    /* =====================================================
       PROGRESS STYLE
    ===================================================== */

    const getProgressStyle =
        (
            progress: number
        ) => {
            if (
                progress >= 100
            ) {
                return {
                    container:
                        "bg-green-100",

                    text:
                        "text-green-700",
                };
            }

            if (
                progress >= 50
            ) {
                return {
                    container:
                        "bg-blue-100",

                    text:
                        "text-blue-700",
                };
            }

            if (
                progress > 0
            ) {
                return {
                    container:
                        "bg-yellow-100",

                    text:
                        "text-yellow-700",
                };
            }

            return {
                container:
                    "bg-gray-100",

                text:
                    "text-gray-500",
            };
        };

    /* =====================================================
       AUTH LOADING
    ===================================================== */

    if (authLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <ActivityIndicator
                    size="large"
                    color="#A8794A"
                />

                <Text className="mt-3 text-center text-sm text-gray-500">
                    Checking admin session...
                </Text>
            </View>
        );
    }

    /* =====================================================
       TRANSACTION SESSION CHECKING
    ===================================================== */

    if (checkingSession) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <ActivityIndicator
                    size="large"
                    color="#A8794A"
                />

                <Text className="mt-3 text-center text-sm text-gray-500">
                    Checking Transaction Panel access...
                </Text>
            </View>
        );
    }

    /* =====================================================
       NO TRANSACTION ACCESS
    ===================================================== */

    if (!transactionUser) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <View className="w-full max-w-[380px] items-center rounded-3xl border border-gray-200 bg-white px-6 py-10">
                    <View className="mb-5 h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <Ionicons
                            name="lock-closed-outline"
                            size={26}
                            color="#6b7280"
                        />
                    </View>

                    <Text className="text-center text-xl font-semibold text-gray-800">
                        Transaction Access Required
                    </Text>

                    <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
                        {errorMessage ||
                            "Your Admin account does not have access to the Transaction Panel."}
                    </Text>

                    <Pressable
                        onPress={() =>
                            router.back()
                        }
                        className="mt-6 rounded-xl bg-bronze px-6 py-3"
                    >
                        <Text className="font-semibold text-white">
                            Back to Admin Panel
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    /* =====================================================
       INITIAL LOADING
    ===================================================== */

    if (
        loading &&
        !refreshing
    ) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <ActivityIndicator
                    size="large"
                    color="#A8794A"
                />

                <Text className="mt-3 text-center text-sm text-gray-500">
                    Loading transactions...
                </Text>
            </View>
        );
    }

    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 40,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            handleRefresh
                        }
                        tintColor="#A8794A"
                    />
                }
            >
                {/* =========================================
                    HEADER
                ========================================= */}

                <View className="mb-5 flex-row items-start justify-between">
                    <View className="min-w-0 flex-1 pr-3">
                        <Text className="text-2xl font-bold text-gray-800">
                            Transactions
                        </Text>

                        <Text className="mt-1 text-sm leading-5 text-gray-500">
                            Manage your real estate transactions.
                        </Text>
                    </View>

                    <Pressable
                        onPress={() =>
                            router.push(
                                "/(transactions)/account" as any
                            )
                        }
                        className="h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white active:bg-gray-100"
                    >
                        <Ionicons
                            name="settings-outline"
                            size={21}
                            color="#374151"
                        />
                    </Pressable>
                </View>

                {/* =========================================
                    ACTION BUTTONS
                ========================================= */}

                <View className="mb-5 flex-row gap-3">
                    <Pressable
                        onPress={() =>
                            router.push(
                                "/(transactions)/archived" as any
                            )
                        }
                        className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-3"
                    >
                        <Archive
                            size={17}
                            color="#374151"
                        />

                        <Text className="ml-2 text-xs font-semibold text-gray-700 sm:text-sm">
                            Archived
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={
                            createTransaction
                        }
                        className="flex-1 flex-row items-center justify-center rounded-xl bg-bronze px-3 py-3"
                    >
                        <Plus
                            size={17}
                            color="#ffffff"
                        />

                        <Text className="ml-2 text-xs font-semibold text-white sm:text-sm">
                            Create Transaction
                        </Text>
                    </Pressable>
                </View>

                {/* =========================================
                    ERROR
                ========================================= */}

                {errorMessage && (
                    <View className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <Text className="font-semibold text-red-700">
                            Unable to load transactions
                        </Text>

                        <Text className="mt-1 text-sm leading-5 text-red-600">
                            {errorMessage}
                        </Text>

                        <Pressable
                            onPress={() =>
                                fetchTransactions()
                            }
                            className="mt-3 self-start rounded-lg bg-red-500 px-4 py-2.5"
                        >
                            <Text className="text-sm font-semibold text-white">
                                Try Again
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* =========================================
                    TRANSACTIONS CONTAINER
                ========================================= */}

                <View className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
                    {transactions.length ===
                    0 ? (
                        <View className="items-center px-6 py-16">
                            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-bronze/10">
                                <Building2
                                    size={27}
                                    color="#A8794A"
                                />
                            </View>

                            <Text className="text-center text-xl font-semibold text-gray-700">
                                No transactions yet
                            </Text>

                            <Text className="mt-2 max-w-[300px] text-center text-sm leading-5 text-gray-400">
                                Create your first real estate transaction to get started.
                            </Text>

                            <Pressable
                                onPress={
                                    createTransaction
                                }
                                className="mt-5 rounded-xl bg-bronze px-5 py-3"
                            >
                                <Text className="text-sm font-semibold text-white">
                                    Create Transaction
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View>
                            {transactions.map(
                                (
                                    tx,
                                    index
                                ) => {
                                    const statusStyle =
                                        getStatusStyle(
                                            tx.status
                                        );

                                    const progressStyle =
                                        getProgressStyle(
                                            tx.progress
                                        );

                                    const isProgressLoading =
                                        loadingProgress[
                                            tx.id
                                        ];

                                    const hasParties =
                                        tx.totalParties >
                                        0;

                                    return (
                                        <View
                                            key={
                                                tx.id
                                            }
                                            className={`p-4 sm:p-5 ${
                                                index <
                                                transactions.length -
                                                    1
                                                    ? "border-b border-gray-100"
                                                    : ""
                                            }`}
                                        >
                                            {/* ==================================
                                                TOP
                                            ================================== */}

                                            <View className="flex-row items-start justify-between gap-3">
                                                <View className="min-w-0 flex-1">
                                                    <Text
                                                        numberOfLines={
                                                            2
                                                        }
                                                        className="text-base font-semibold leading-5 text-gray-800"
                                                    >
                                                        {
                                                            tx.name
                                                        }
                                                    </Text>

                                                    <View className="mt-2 flex-row items-start">
                                                        <Building2
                                                            size={
                                                                15
                                                            }
                                                            color="#9ca3af"
                                                            style={{
                                                                marginTop:
                                                                    2,
                                                            }}
                                                        />

                                                        <Text
                                                            className="ml-2 flex-1 text-sm leading-5 text-gray-500"
                                                            numberOfLines={
                                                                3
                                                            }
                                                        >
                                                            {
                                                                tx.property
                                                            }
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* STATUS */}

                                                <View className="shrink-0">
                                                    <View
                                                        className={`flex-row items-center rounded-full px-2.5 py-1.5 ${statusStyle.container}`}
                                                    >
                                                        {tx.status ===
                                                        "Completed" ? (
                                                            <CheckCircle2
                                                                size={
                                                                    13
                                                                }
                                                                color={
                                                                    statusStyle.iconColor
                                                                }
                                                            />
                                                        ) : null}

                                                        <Text
                                                            className={`text-[10px] font-semibold sm:text-xs ${statusStyle.text}`}
                                                        >
                                                            {
                                                                tx.status
                                                            }
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* ==================================
                                                CREATED DATE
                                            ================================== */}

                                            <View className="mt-4 flex-row items-center">
                                                <CalendarDays
                                                    size={
                                                        15
                                                    }
                                                    color="#9ca3af"
                                                />

                                                <Text className="ml-2 text-xs text-gray-500 sm:text-sm">
                                                    Created:{" "}
                                                    {
                                                        tx.createdAt
                                                    }
                                                </Text>
                                            </View>

                                            {/* ==================================
                                                PARTY COUNT
                                            ================================== */}

                                            {hasParties && (
                                                <View className="mt-2 flex-row items-center">
                                                    <Users
                                                        size={
                                                            15
                                                        }
                                                        color="#9ca3af"
                                                    />

                                                    <Text className="ml-2 text-xs text-gray-500 sm:text-sm">
                                                        {
                                                            tx.completedParties
                                                        }{" "}
                                                        of{" "}
                                                        {
                                                            tx.totalParties
                                                        }{" "}
                                                        parties completed
                                                    </Text>
                                                </View>
                                            )}

                                            {/* ==================================
                                                PROGRESS
                                            ================================== */}

                                            <View className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5">
                                                {/* HEADER */}

                                                <View className="flex-row items-start justify-between gap-3">
                                                    <View className="min-w-0 flex-1">
                                                        <Text className="text-xs font-semibold text-gray-800 sm:text-sm">
                                                            Completion Progress
                                                        </Text>

                                                        <Text className="mt-1 text-[11px] leading-4 text-gray-500">
                                                            {isProgressLoading
                                                                ? "Checking party progress..."
                                                                : hasParties
                                                                ? `${tx.completedParties} of ${tx.totalParties} parties completed`
                                                                : "No parties added"}
                                                        </Text>
                                                    </View>

                                                    <Text
                                                        className={`text-base font-bold sm:text-lg ${
                                                            tx.status ===
                                                            "Completed"
                                                                ? "text-green-600"
                                                                : "text-bronze"
                                                        }`}
                                                    >
                                                        {isProgressLoading
                                                            ? "..."
                                                            : `${tx.progress}%`}
                                                    </Text>
                                                </View>

                                                {/* PROGRESS BAR */}

                                                <View className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                                                    <View
                                                        className={`absolute inset-y-0 left-0 rounded-full ${
                                                            tx.status ===
                                                            "Completed"
                                                                ? "bg-green-500"
                                                                : "bg-bronze"
                                                        }`}
                                                        style={{
                                                            width: `${Math.min(
                                                                Math.max(
                                                                    tx.progress,
                                                                    0
                                                                ),
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </View>

                                                {/* FOOTER */}

                                                <View className="mt-2 flex-row flex-wrap items-center justify-between gap-2">
                                                    <Text className="text-[10px] text-gray-400 sm:text-[11px]">
                                                        {
                                                            tx.completedSteps
                                                        }{" "}
                                                        /{" "}
                                                        {tx.totalSteps ||
                                                            "-"}{" "}
                                                        steps
                                                    </Text>

                                                    {tx.status ===
                                                        "Completed" && (
                                                        <View className="flex-row items-center">
                                                            <CheckCircle2
                                                                size={
                                                                    13
                                                                }
                                                                color="#22c55e"
                                                            />

                                                            <Text className="ml-1 text-[10px] font-semibold text-green-600 sm:text-[11px]">
                                                                Complete
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>

                                            {/* ==================================
                                                ACTIONS
                                            ================================== */}

                                            <View className="mt-4 flex-row gap-3">
                                                {/* OPEN */}

                                                <Pressable
                                                    onPress={() =>
                                                        openTransaction(
                                                            tx.id
                                                        )
                                                    }
                                                    className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-3 active:bg-gray-50"
                                                >
                                                    <ExternalLink
                                                        size={
                                                            16
                                                        }
                                                        color="#374151"
                                                    />

                                                    <Text className="ml-2 text-sm font-semibold text-gray-700">
                                                        Open
                                                    </Text>
                                                </Pressable>

                                                {/* ARCHIVE */}

                                                <Pressable
                                                    onPress={() =>
                                                        archiveTransaction(
                                                            tx.id
                                                        )
                                                    }
                                                    disabled={
                                                        archivingId ===
                                                        tx.id
                                                    }
                                                    className={`flex-1 flex-row items-center justify-center rounded-xl bg-red-500 px-3 py-3 ${
                                                        archivingId ===
                                                        tx.id
                                                            ? "opacity-50"
                                                            : ""
                                                    }`}
                                                >
                                                    {archivingId ===
                                                    tx.id ? (
                                                        <ActivityIndicator
                                                            size="small"
                                                            color="#ffffff"
                                                        />
                                                    ) : (
                                                        <>
                                                            <Archive
                                                                size={
                                                                    16
                                                                }
                                                                color="#ffffff"
                                                            />

                                                            <Text className="ml-2 text-sm font-semibold text-white">
                                                                Archive
                                                            </Text>
                                                        </>
                                                    )}
                                                </Pressable>
                                            </View>
                                        </View>
                                    );
                                }
                            )}
                        </View>
                    )}
                </View>

                {/* =========================================
                    MOBILE STEP LEGEND
                ========================================= */}

                {transactions.length >
                    0 && (
                    <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
                            <Text className="text-xs font-semibold text-gray-500">
                                Party steps:
                            </Text>

                            {PARTY_STEPS.map(
                                (
                                    step,
                                    index
                                ) => (
                                    <View
                                        key={
                                            step
                                        }
                                        className="flex-row items-center"
                                    >
                                        <View className="h-5 w-5 items-center justify-center rounded-full bg-gray-100">
                                            <Text className="text-[10px] font-bold text-gray-500">
                                                {index +
                                                    1}
                                            </Text>
                                        </View>

                                        <Text className="ml-1.5 text-xs text-gray-500">
                                            {
                                                step
                                            }
                                        </Text>
                                    </View>
                                )
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}







































// import React, {
//     useCallback,
//     useEffect,
//     useState,
// } from "react";

// import {
//     ActivityIndicator,
//     Alert,
//     Pressable,
//     RefreshControl,
//     ScrollView,
//     Text,
//     View,
// } from "react-native";

// import {
//     Archive,
//     ChevronRight,
//     Plus,
//     RefreshCw,
// } from "lucide-react-native";


// import { Ionicons } from "@expo/vector-icons";

// import AsyncStorage from "@react-native-async-storage/async-storage";

// import { useRouter } from "expo-router";

// import { useAuth } from "../../contexts/AuthContext";

// /* =========================================================
//    CONSTANTS
// ========================================================= */

// const API_URL = "https://realtorparth.ca";

// const CURRENT_TRANSACTION_KEY =
//     "currentTransactionId";

// /* =========================================================
//    TYPES
// ========================================================= */

// interface TransactionUser {
//     id?: string;
//     _id?: string;
//     userId?: string;
//     name?: string;
//     email?: string;
//     role?: string;
//     isSuperAdmin?: boolean;
// }

// interface Transaction {
//     id: string;
//     name: string;
//     property: string;
//     status: string;
//     createdAt: string;
// }

// /* =========================================================
//    HELPER
// ========================================================= */

// const getTransactionUserId = (
//     user: TransactionUser | null
// ): string | null => {
//     if (!user) {
//         return null;
//     }

//     if (
//         typeof user.id === "string" &&
//         user.id.trim()
//     ) {
//         return user.id;
//     }

//     if (
//         typeof user._id === "string" &&
//         user._id.trim()
//     ) {
//         return user._id;
//     }

//     if (
//         typeof user.userId === "string" &&
//         user.userId.trim()
//     ) {
//         return user.userId;
//     }

//     return null;
// };

// /* =========================================================
//    COMPONENT
// ========================================================= */

// export default function TransactionsList() {
//     const router = useRouter();

//     const {
//         user,
//         loading: authLoading,
//     } = useAuth();

//     /* =====================================================
//        STATE
//     ===================================================== */

//     const [
//         transactionUser,
//         setTransactionUser,
//     ] = useState<TransactionUser | null>(null);

//     const [
//         transactions,
//         setTransactions,
//     ] = useState<Transaction[]>([]);

//     const [
//         loading,
//         setLoading,
//     ] = useState(true);

//     const [
//         refreshing,
//         setRefreshing,
//     ] = useState(false);

//     const [
//         archivingId,
//         setArchivingId,
//     ] = useState<string | null>(null);

//     const [
//         errorMessage,
//         setErrorMessage,
//     ] = useState<string | null>(null);

//     const [
//         checkingSession,
//         setCheckingSession,
//     ] = useState(true);

//     /* =====================================================
//        RESOLVE TRANSACTION USER FROM ADMIN EMAIL
//     ===================================================== */

//     const resolveTransactionUser =
//         useCallback(async () => {
//             if (authLoading) {
//                 return null;
//             }

//             if (!user?.email) {
//                 setTransactionUser(null);
//                 setCheckingSession(false);

//                 return null;
//             }

//             const controller =
//                 new AbortController();

//             const timeout =
//                 setTimeout(() => {
//                     controller.abort();
//                 }, 10000);

//             try {
//                 setCheckingSession(true);

//                 /*
//                  * IMPORTANT:
//                  *
//                  * We use the SAME email as the
//                  * currently logged-in Admin.
//                  *
//                  * This matches the website flow.
//                  */

//                 const url =
//                     `${API_URL}/api/transactions/check-super-admin/${encodeURIComponent(
//                         user.email
//                     )}`;

//                 console.log(
//                     "Checking Transaction access:",
//                     url
//                 );

//                 const res =
//                     await fetch(url, {
//                         method: "GET",

//                         headers: {
//                             Accept:
//                                 "application/json",
//                         },

//                         signal:
//                             controller.signal,
//                     });

//                 let data: any;

//                 try {
//                     data =
//                         await res.json();
//                 } catch {
//                     throw new Error(
//                         "Invalid server response"
//                     );
//                 }

//                 console.log(
//                     "Transaction access response:",
//                     data
//                 );

//                 if (!res.ok) {
//                     throw new Error(
//                         data?.message ||
//                         `Error ${res.status}`
//                     );
//                 }

//                 if (!data?.success) {
//                     throw new Error(
//                         data?.message ||
//                         "Transaction access could not be verified."
//                     );
//                 }

//                 /*
//                  * Website checks this.
//                  */

//                 if (!data?.isSuperAdmin) {
//                     throw new Error(
//                         "This admin account does not have Transaction Panel access."
//                     );
//                 }

//                 /*
//                  * Different possible backend response
//                  * structures are supported here.
//                  */

//                 const resolvedUser =
//                     data?.user ||
//                     data?.transactionUser ||
//                     data?.admin ||
//                     data;

//                 const resolvedId =
//                     resolvedUser?.id ||
//                     resolvedUser?._id ||
//                     resolvedUser?.userId;

//                 if (!resolvedId) {
//                     console.error(
//                         "Transaction user ID missing. Response:",
//                         data
//                     );

//                     throw new Error(
//                         "Transaction user ID was not returned by the server."
//                     );
//                 }

//                 const normalizedUser: TransactionUser = {
//                     ...resolvedUser,
//                     id: String(
//                         resolvedId
//                     ),
//                 };

//                 setTransactionUser(
//                     normalizedUser
//                 );

//                 return normalizedUser;
//             } catch (error: any) {
//                 console.error(
//                     "Resolve Transaction User Error:",
//                     error
//                 );

//                 setTransactionUser(
//                     null
//                 );

//                 if (
//                     error?.name ===
//                     "AbortError"
//                 ) {
//                     setErrorMessage(
//                         "Transaction access request timed out."
//                     );
//                 } else if (
//                     error?.name ===
//                     "TypeError"
//                 ) {
//                     setErrorMessage(
//                         "Network error. Please check your internet connection."
//                     );
//                 } else {
//                     setErrorMessage(
//                         error?.message ||
//                         "Unable to verify Transaction Panel access."
//                     );
//                 }

//                 return null;
//             } finally {
//                 clearTimeout(timeout);

//                 setCheckingSession(
//                     false
//                 );
//             }
//         }, [
//             authLoading,
//             user?.email,
//         ]);

//     /* =====================================================
//        FETCH TRANSACTIONS
//     ===================================================== */

//     const fetchTransactions =
//         useCallback(
//             async (
//                 showLoader = true
//             ) => {
//                 const userId =
//                     getTransactionUserId(
//                         transactionUser
//                     );

//                 if (!userId) {
//                     setLoading(false);
//                     return;
//                 }

//                 if (showLoader) {
//                     setLoading(true);
//                 }

//                 /*
//                  * Don't clear an access error while
//                  * the transaction user is still valid.
//                  */

//                 setErrorMessage(null);

//                 const controller =
//                     new AbortController();

//                 const timeout =
//                     setTimeout(() => {
//                         controller.abort();
//                     }, 10000);

//                 try {
//                     const url =
//                         `${API_URL}/api/transactions/list/${encodeURIComponent(
//                             userId
//                         )}`;

//                     console.log(
//                         "Fetching transactions:",
//                         url
//                     );

//                     const res =
//                         await fetch(url, {
//                             method: "GET",

//                             headers: {
//                                 Accept:
//                                     "application/json",
//                             },

//                             signal:
//                                 controller.signal,
//                         });

//                     let data: any;

//                     try {
//                         data =
//                             await res.json();
//                     } catch {
//                         throw new Error(
//                             "Invalid server response"
//                         );
//                     }

//                     if (!res.ok) {
//                         throw new Error(
//                             data?.message ||
//                             `Error ${res.status}`
//                         );
//                     }

//                     if (!data?.success) {
//                         throw new Error(
//                             data?.message ||
//                             "Failed to fetch transactions"
//                         );
//                     }

//                     const mapped: Transaction[] =
//                         Array.isArray(
//                             data.transactions
//                         )
//                             ? data.transactions.map(
//                                 (tx: any) => {
//                                     let createdAt =
//                                         "";

//                                     if (
//                                         tx?.createdAt
//                                     ) {
//                                         const date =
//                                             new Date(
//                                                 tx.createdAt
//                                             );

//                                         if (
//                                             !Number.isNaN(
//                                                 date.getTime()
//                                             )
//                                         ) {
//                                             createdAt =
//                                                 date
//                                                     .toISOString()
//                                                     .split(
//                                                         "T"
//                                                     )[0];
//                                         }
//                                     }

//                                     return {
//                                         id: String(
//                                             tx?._id ??
//                                             tx?.id ??
//                                             ""
//                                         ),

//                                         name:
//                                             tx?.name ||
//                                             "Unnamed Transaction",

//                                         property:
//                                             tx?.propertyAddress ||
//                                             "No property address",

//                                         status:
//                                             tx?.status ||
//                                             "Pending",

//                                         createdAt,
//                                     };
//                                 }
//                             )
//                             : [];

//                     setTransactions(
//                         mapped
//                     );
//                 } catch (
//                 error: any
//                 ) {
//                     console.error(
//                         "Fetch Transactions Error:",
//                         error
//                     );

//                     if (
//                         error?.name ===
//                         "AbortError"
//                     ) {
//                         setErrorMessage(
//                             "Request timed out."
//                         );
//                     } else if (
//                         error?.name ===
//                         "TypeError"
//                     ) {
//                         setErrorMessage(
//                             "Network error. Please check your internet connection."
//                         );
//                     } else {
//                         setErrorMessage(
//                             error?.message ||
//                             "Failed to load transactions."
//                         );
//                     }
//                 } finally {
//                     clearTimeout(timeout);

//                     setLoading(false);
//                     setRefreshing(false);
//                 }
//             },
//             [
//                 transactionUser,
//             ]
//         );

//     /* =====================================================
//        INITIAL SESSION RESOLUTION
//     ===================================================== */

//     useEffect(() => {
//         if (!authLoading) {
//             resolveTransactionUser();
//         }
//     }, [
//         authLoading,
//         resolveTransactionUser,
//     ]);

//     /* =====================================================
//        FETCH AFTER TRANSACTION USER RESOLVED
//     ===================================================== */

//     useEffect(() => {
//         if (
//             !checkingSession &&
//             transactionUser
//         ) {
//             fetchTransactions();
//         }
//     }, [
//         checkingSession,
//         transactionUser,
//         fetchTransactions,
//     ]);

//     /* =====================================================
//        REFRESH
//     ===================================================== */

//     const handleRefresh =
//         async () => {
//             setRefreshing(true);

//             /*
//              * Resolve the transaction user again
//              * using the CURRENT Admin email.
//              */

//             const resolvedUser =
//                 await resolveTransactionUser();

//             if (resolvedUser) {
//                 /*
//                  * fetchTransactions uses state, so
//                  * wait for the state update by directly
//                  * requesting with the resolved ID here.
//                  */

//                 const userId =
//                     getTransactionUserId(
//                         resolvedUser
//                     );

//                 if (!userId) {
//                     setRefreshing(false);
//                     return;
//                 }

//                 const controller =
//                     new AbortController();

//                 const timeout =
//                     setTimeout(() => {
//                         controller.abort();
//                     }, 10000);

//                 try {
//                     const res =
//                         await fetch(
//                             `${API_URL}/api/transactions/list/${encodeURIComponent(
//                                 userId
//                             )}`,
//                             {
//                                 method: "GET",

//                                 headers: {
//                                     Accept:
//                                         "application/json",
//                                 },

//                                 signal:
//                                     controller.signal,
//                             }
//                         );

//                     let data: any;

//                     try {
//                         data =
//                             await res.json();
//                     } catch {
//                         throw new Error(
//                             "Invalid server response"
//                         );
//                     }

//                     if (!res.ok) {
//                         throw new Error(
//                             data?.message ||
//                             `Error ${res.status}`
//                         );
//                     }

//                     if (!data?.success) {
//                         throw new Error(
//                             data?.message ||
//                             "Failed to fetch transactions"
//                         );
//                     }

//                     const mapped: Transaction[] =
//                         Array.isArray(
//                             data.transactions
//                         )
//                             ? data.transactions.map(
//                                 (tx: any) => ({
//                                     id: String(
//                                         tx?._id ??
//                                         tx?.id ??
//                                         ""
//                                     ),

//                                     name:
//                                         tx?.name ||
//                                         "Unnamed Transaction",

//                                     property:
//                                         tx?.propertyAddress ||
//                                         "No property address",

//                                     status:
//                                         tx?.status ||
//                                         "Pending",

//                                     createdAt:
//                                         tx?.createdAt
//                                             ? new Date(
//                                                 tx.createdAt
//                                             )
//                                                 .toISOString()
//                                                 .split(
//                                                     "T"
//                                                 )[0]
//                                             : "",
//                                 })
//                             )
//                             : [];

//                     setTransactions(
//                         mapped
//                     );

//                     setErrorMessage(
//                         null
//                     );
//                 } catch (
//                 error: any
//                 ) {
//                     console.error(
//                         "Refresh Transactions Error:",
//                         error
//                     );

//                     if (
//                         error?.name ===
//                         "AbortError"
//                     ) {
//                         setErrorMessage(
//                             "Request timed out."
//                         );
//                     } else if (
//                         error?.name ===
//                         "TypeError"
//                     ) {
//                         setErrorMessage(
//                             "Network error."
//                         );
//                     } else {
//                         setErrorMessage(
//                             error?.message ||
//                             "Failed to refresh transactions."
//                         );
//                     }
//                 } finally {
//                     clearTimeout(timeout);

//                     setRefreshing(false);
//                 }
//             } else {
//                 setRefreshing(false);
//             }
//         };

//     /* =====================================================
//        CREATE TRANSACTION
//     ===================================================== */

//     const createTransaction =
//         async () => {
//             try {
//                 await AsyncStorage.removeItem(
//                     CURRENT_TRANSACTION_KEY
//                 );
//             } catch (error) {
//                 console.error(
//                     "Failed to clear transaction ID:",
//                     error
//                 );
//             }

//             router.push(
//                 "/(transactions)/new-transaction" as any
//             );
//         };

//     /* =====================================================
//        OPEN TRANSACTION
//     ===================================================== */

//     const openTransaction =
//         async (
//             id: string
//         ) => {
//             try {
//                 await AsyncStorage.setItem(
//                     CURRENT_TRANSACTION_KEY,
//                     id
//                 );

//                 router.push(
//                     "/(transactions)/new-transaction" as any
//                 );
//             } catch (error) {
//                 console.error(
//                     "Failed to save transaction ID:",
//                     error
//                 );

//                 Alert.alert(
//                     "Error",
//                     "Unable to open this transaction."
//                 );
//             }
//         };

//     /* =====================================================
//        ARCHIVE TRANSACTION
//     ===================================================== */

//     const archiveTransaction =
//         (
//             id: string
//         ) => {
//             const userId =
//                 getTransactionUserId(
//                     transactionUser
//                 );

//             if (!userId) {
//                 Alert.alert(
//                     "Login Required",
//                     "Transaction user could not be found."
//                 );

//                 return;
//             }

//             Alert.alert(
//                 "Archive Transaction",
//                 "Are you sure you want to archive this transaction?",
//                 [
//                     {
//                         text: "Cancel",
//                         style: "cancel",
//                     },

//                     {
//                         text: "Archive",
//                         style: "destructive",

//                         onPress:
//                             async () => {
//                                 setArchivingId(
//                                     id
//                                 );

//                                 const controller =
//                                     new AbortController();

//                                 const timeout =
//                                     setTimeout(
//                                         () => {
//                                             controller.abort();
//                                         },
//                                         10000
//                                     );

//                                 try {
//                                     const res =
//                                         await fetch(
//                                             `${API_URL}/api/transactions/archive/${encodeURIComponent(
//                                                 id
//                                             )}`,
//                                             {
//                                                 method:
//                                                     "PUT",

//                                                 headers: {
//                                                     Accept:
//                                                         "application/json",

//                                                     "Content-Type":
//                                                         "application/json",
//                                                 },

//                                                 body:
//                                                     JSON.stringify({
//                                                         userId,
//                                                     }),

//                                                 signal:
//                                                     controller.signal,
//                                             }
//                                         );

//                                     let data: any;

//                                     try {
//                                         data =
//                                             await res.json();
//                                     } catch {
//                                         throw new Error(
//                                             "Invalid server response"
//                                         );
//                                     }

//                                     if (!res.ok) {
//                                         throw new Error(
//                                             data?.message ||
//                                             `Error ${res.status}`
//                                         );
//                                     }

//                                     if (
//                                         !data?.success
//                                     ) {
//                                         throw new Error(
//                                             data?.message ||
//                                             "Failed to archive"
//                                         );
//                                     }

//                                     /*
//                                      * Same as website:
//                                      * remove immediately.
//                                      */

//                                     setTransactions(
//                                         previous =>
//                                             previous.filter(
//                                                 tx =>
//                                                     tx.id !==
//                                                     id
//                                             )
//                                     );

//                                     /*
//                                      * Clear current transaction
//                                      * if the archived one is open.
//                                      */

//                                     const currentId =
//                                         await AsyncStorage.getItem(
//                                             CURRENT_TRANSACTION_KEY
//                                         );

//                                     if (
//                                         currentId ===
//                                         id
//                                     ) {
//                                         await AsyncStorage.removeItem(
//                                             CURRENT_TRANSACTION_KEY
//                                         );
//                                     }

//                                     Alert.alert(
//                                         "Success",
//                                         "Transaction archived successfully."
//                                     );
//                                 } catch (
//                                 error: any
//                                 ) {
//                                     console.error(
//                                         "Archive Error:",
//                                         error
//                                     );

//                                     if (
//                                         error?.name ===
//                                         "AbortError"
//                                     ) {
//                                         Alert.alert(
//                                             "Request Timed Out",
//                                             "Please try again."
//                                         );
//                                     } else if (
//                                         error?.name ===
//                                         "TypeError"
//                                     ) {
//                                         Alert.alert(
//                                             "Network Error",
//                                             "Unable to connect to the server."
//                                         );
//                                     } else {
//                                         Alert.alert(
//                                             "Error",
//                                             error?.message ||
//                                             "Server error"
//                                         );
//                                     }
//                                 } finally {
//                                     clearTimeout(
//                                         timeout
//                                     );

//                                     setArchivingId(
//                                         null
//                                     );
//                                 }
//                             },
//                     },
//                 ]
//             );
//         };

//     /* =====================================================
//        STATUS STYLE
//     ===================================================== */

//     const getStatusStyle =
//         (
//             status: string
//         ) => {
//             if (
//                 status ===
//                 "Completed"
//             ) {
//                 return {
//                     container:
//                         "bg-green-100",
//                     text:
//                         "text-green-700",
//                 };
//             }

//             return {
//                 container:
//                     "bg-yellow-100",
//                 text:
//                     "text-yellow-700",
//             };
//         };

//     /* =====================================================
//        AUTH LOADING
//     ===================================================== */

//     if (authLoading) {
//         return (
//             <View className="flex-1 items-center justify-center bg-gray-50">
//                 <ActivityIndicator
//                     size="large"
//                     color="#A8794A"
//                 />

//                 <Text className="mt-3 text-sm text-gray-500">
//                     Checking admin session...
//                 </Text>
//             </View>
//         );
//     }

//     /* =====================================================
//        TRANSACTION SESSION CHECKING
//     ===================================================== */

//     if (checkingSession) {
//         return (
//             <View className="flex-1 items-center justify-center bg-gray-50">
//                 <ActivityIndicator
//                     size="large"
//                     color="#A8794A"
//                 />

//                 <Text className="mt-3 text-sm text-gray-500">
//                     Checking Transaction Panel access...
//                 </Text>
//             </View>
//         );
//     }

//     /* =====================================================
//        NO TRANSACTION ACCESS
//     ===================================================== */

//     if (!transactionUser) {
//         return (
//             <View className="flex-1 items-center justify-center bg-gray-50 px-6">
//                 <View className="w-full max-w-[380px] items-center rounded-3xl border border-gray-200 bg-white px-6 py-10">
//                     <Text className="text-xl font-semibold text-gray-800">
//                         Transaction Access Required
//                     </Text>

//                     <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
//                         {errorMessage ||
//                             "Your Admin account does not have access to the Transaction Panel."}
//                     </Text>

//                     <Pressable
//                         onPress={() =>
//                             router.back()
//                         }
//                         className="mt-6 rounded-xl bg-bronze px-6 py-3"
//                     >
//                         <Text className="font-semibold text-white">
//                             Back to Admin Panel
//                         </Text>
//                     </Pressable>
//                 </View>
//             </View>
//         );
//     }

//     /* =====================================================
//        LOADING
//     ===================================================== */

//     if (
//         loading &&
//         !refreshing
//     ) {
//         return (
//             <View className="flex-1 items-center justify-center bg-gray-50">
//                 <ActivityIndicator
//                     size="large"
//                     color="#A8794A"
//                 />

//                 <Text className="mt-3 text-sm text-gray-500">
//                     Loading transactions...
//                 </Text>
//             </View>
//         );
//     }

//     /* =====================================================
//        MAIN UI
//     ===================================================== */

//     return (
//         <View className="flex-1 bg-gray-50">
//             <ScrollView
//                 className="flex-1"
//                 contentContainerStyle={{
//                     padding: 20,
//                     paddingBottom: 40,
//                 }}
//                 refreshControl={
//                     <RefreshControl
//                         refreshing={
//                             refreshing
//                         }
//                         onRefresh={
//                             handleRefresh
//                         }
//                         tintColor="#A8794A"
//                     />
//                 }
//             >
//                 {/* HEADER */}

//                 {/* <View className="mb-6">
//                     <Text className="text-2xl font-bold text-gray-800">
//                         Transactions
//                     </Text>

//                     <Text className="mt-1 text-sm text-gray-500">
//                         Manage real estate transactions.
//                     </Text>
//                 </View> */}
//                 {/* HEADER */}

//                 <View className="mb-6 flex-row items-start justify-between">
//                     <View className="flex-1 pr-3">
//                         <Text className="text-2xl font-bold text-gray-800">
//                             Transactions
//                         </Text>

//                         <Text className="mt-1 text-sm text-gray-500">
//                             Manage real estate transactions.
//                         </Text>
//                     </View>

//                     {/* ACCOUNT SETTINGS */}

//                     <Pressable
//                         onPress={() =>
//                             router.push(
//                                 "/(transactions)/account" as any
//                             )
//                         }
//                         className="h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white active:bg-gray-100"
//                     >
//                         <Ionicons
//                             name="settings-outline"
//                             size={21}
//                             color="#374151"
//                         />
//                     </Pressable>
//                 </View>

//                 {/* ACTION BUTTONS */}

//                 <View className="mb-6 gap-3">
//                     <Pressable
//                         onPress={() =>
//                             router.push(
//                                 "/(transactions)/archived" as any
//                             )
//                         }
//                         className="flex-row items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3"
//                     >
//                         <Archive
//                             size={18}
//                             color="#374151"
//                         />

//                         <Text className="ml-2 text-sm font-medium text-gray-700">
//                             View Archived
//                         </Text>
//                     </Pressable>

//                     <Pressable
//                         onPress={
//                             createTransaction
//                         }
//                         className="flex-row items-center justify-center rounded-xl bg-bronze px-5 py-3"
//                     >
//                         <Plus
//                             size={18}
//                             color="#ffffff"
//                         />

//                         <Text className="ml-2 text-sm font-semibold text-white">
//                             Create Transaction
//                         </Text>
//                     </Pressable>
//                 </View>

//                 {/* ERROR */}

//                 {errorMessage && (
//                     <View className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
//                         <Text className="font-semibold text-red-700">
//                             Unable to load transactions
//                         </Text>

//                         <Text className="mt-1 text-sm leading-5 text-red-600">
//                             {errorMessage}
//                         </Text>

//                         <Pressable
//                             onPress={() =>
//                                 fetchTransactions()
//                             }
//                             className="mt-3 self-start rounded-lg bg-red-500 px-4 py-2.5"
//                         >
//                             <Text className="text-sm font-semibold text-white">
//                                 Try Again
//                             </Text>
//                         </Pressable>
//                     </View>
//                 )}

//                 {/* TABLE CARD */}

//                 <View className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
//                     {transactions.length ===
//                         0 ? (
//                         <View className="items-center px-6 py-16">
//                             <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-gray-100">
//                                 <RefreshCw
//                                     size={25}
//                                     color="#9ca3af"
//                                 />
//                             </View>

//                             <Text className="text-xl font-semibold text-gray-700">
//                                 No transactions yet
//                             </Text>

//                             <Text className="mt-2 max-w-[300px] text-center text-sm leading-5 text-gray-400">
//                                 Create your first transaction to get started.
//                             </Text>

//                             <Pressable
//                                 onPress={
//                                     createTransaction
//                                 }
//                                 className="mt-5 rounded-xl bg-bronze px-5 py-3"
//                             >
//                                 <Text className="text-sm font-semibold text-white">
//                                     Create Transaction
//                                 </Text>
//                             </Pressable>
//                         </View>
//                     ) : (
//                         <View>
//                             {transactions.map(
//                                 (
//                                     tx,
//                                     index
//                                 ) => {
//                                     const statusStyle =
//                                         getStatusStyle(
//                                             tx.status
//                                         );

//                                     return (
//                                         <View
//                                             key={
//                                                 tx.id
//                                             }
//                                             className={`p-5 ${index <
//                                                     transactions.length -
//                                                     1
//                                                     ? "border-b border-gray-100"
//                                                     : ""
//                                                 }`}
//                                         >
//                                             {/* TOP */}

//                                             <View className="flex-row items-start justify-between gap-3">
//                                                 <View className="min-w-0 flex-1">
//                                                     <Text
//                                                         numberOfLines={
//                                                             2
//                                                         }
//                                                         className="font-semibold text-gray-800"
//                                                     >
//                                                         {
//                                                             tx.name
//                                                         }
//                                                     </Text>

//                                                     <Text
//                                                         className="mt-1 text-sm text-gray-500"
//                                                         numberOfLines={
//                                                             3
//                                                         }
//                                                     >
//                                                         {
//                                                             tx.property
//                                                         }
//                                                     </Text>
//                                                 </View>

//                                                 {/* STATUS */}

//                                                 <View
//                                                     className={`rounded-full px-3 py-1 ${statusStyle.container}`}
//                                                 >
//                                                     <Text
//                                                         className={`text-xs font-semibold ${statusStyle.text}`}
//                                                     >
//                                                         {
//                                                             tx.status
//                                                         }
//                                                     </Text>
//                                                 </View>
//                                             </View>

//                                             {/* DATE */}

//                                             <View className="mt-4">
//                                                 <Text className="text-sm text-gray-500">
//                                                     Created:{" "}
//                                                     {
//                                                         tx.createdAt
//                                                     }
//                                                 </Text>
//                                             </View>

//                                             {/* ACTIONS */}

//                                             <View className="mt-4 flex-row gap-3">
//                                                 <Pressable
//                                                     onPress={() =>
//                                                         openTransaction(
//                                                             tx.id
//                                                         )
//                                                     }
//                                                     className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 px-4 py-3"
//                                                 >
//                                                     <Text className="text-sm font-medium text-gray-700">
//                                                         Open
//                                                     </Text>

//                                                     <ChevronRight
//                                                         size={
//                                                             16
//                                                         }
//                                                         color="#6b7280"
//                                                         style={{
//                                                             marginLeft:
//                                                                 4,
//                                                         }}
//                                                     />
//                                                 </Pressable>

//                                                 <Pressable
//                                                     onPress={() =>
//                                                         archiveTransaction(
//                                                             tx.id
//                                                         )
//                                                     }
//                                                     disabled={
//                                                         archivingId ===
//                                                         tx.id
//                                                     }
//                                                     className={`flex-1 flex-row items-center justify-center rounded-xl bg-red-500 px-4 py-3 ${archivingId ===
//                                                             tx.id
//                                                             ? "opacity-50"
//                                                             : ""
//                                                         }`}
//                                                 >
//                                                     {archivingId ===
//                                                         tx.id ? (
//                                                         <ActivityIndicator
//                                                             size="small"
//                                                             color="#ffffff"
//                                                         />
//                                                     ) : (
//                                                         <>
//                                                             <Archive
//                                                                 size={
//                                                                     16
//                                                                 }
//                                                                 color="#ffffff"
//                                                             />

//                                                             <Text className="ml-2 text-sm font-medium text-white">
//                                                                 Archive
//                                                             </Text>
//                                                         </>
//                                                     )}
//                                                 </Pressable>
//                                             </View>
//                                         </View>
//                                     );
//                                 }
//                             )}
//                         </View>
//                     )}
//                 </View>
//             </ScrollView>
//         </View>
//     );
// }