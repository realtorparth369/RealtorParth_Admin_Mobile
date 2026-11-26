import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import {
    Stack,
    useLocalSearchParams,
    useRouter,
} from "expo-router";

import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Download,
    ExternalLink,
    FileText,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    X,
} from "lucide-react-native";

import { useAuth } from "../../../contexts/AuthContext";


// ============================================================
// API
// ============================================================

const API_BASE =
    "https://realtorparth.ca/api";


// ============================================================
// TYPES
// ============================================================

interface SignerStatus {
    role: string;
    signed: boolean;

    email?: string;
    name?: string;

    recipientId?: string;
    routingOrder?: string;
    clientUserId?: string;
}

interface DocItem {
    name: string;
    key?: string;
    status?: "Filled" | "Not Filled";

    envelopeId?: string;

    signingStatus?: {
        completed: number;
        total: number;
        allSigned: boolean;
        signers: SignerStatus[];
    };
}


// ============================================================
// FINTRAC
// ============================================================

interface AmlHit {
    name?: string;
    matchType?: string;
    category?: string;
    source?: string;
    status?: string;
    score?: number;
    details?: string;
}

interface AmlScreening {
    required?: boolean;

    status?: string;

    provider?: string;

    requestId?: string;

    screeningId?: string;

    searchedName?: string;

    searchedDob?: string;

    searchedGender?: string;

    totalHits?: number;

    matched?: boolean;

    matchFound?: boolean;

    result?: string;

    riskLevel?: string;

    screenedAt?: string | null;

    completedAt?: string | null;

    generatedAt?: string | null;

    error?: string;

    hits?: AmlHit[];

    reportAvailable?: boolean;

    reportUrl?: string;
}

interface DiliSenseReport {
    generated?: boolean;

    status?: string;

    triggeredBy?: string[];

    searchedName?: string;

    searchedDob?: string;

    searchedGender?: string;

    generatedAt?: string | null;

    error?: string;

    reportUrl?: string;

    provider?: string;

    requestId?: string;

    screeningId?: string;

    totalHits?: number;

    matched?: boolean;

    matchFound?: boolean;

    result?: string;

    riskLevel?: string;

    screenedAt?: string | null;

    completedAt?: string | null;

    hits?: AmlHit[];

    reportAvailable?: boolean;
}

interface ClientFintrac {
    clientPoliticallyExposed?: string;

    clientFamilyGovernment?: string;

    clientThirdParty?: string;

    dilisenseReport?: DiliSenseReport | null;

    amlScreening?: AmlScreening | null;

    aml?: AmlScreening | null;
}


// ============================================================
// UPLOADED DOCUMENTS
// ============================================================

interface UploadedDocs {
    licenseImage?: string;
    passportImage?: string;
}


// ============================================================
// DATA
// ============================================================

const generalDocs: DocItem[] = [
    {
        name: "FINTRAC - Individual Identification Information Record Form",
        key: "fintrac",
    },
    {
        name: "FINTRAC - Politically Exposed Person Checklist Form",
        key: "pep",
    },
    {
        name: "Consumer Relationships Guide (Print Friendly)",
        key: "crg",
    },
];

const buyingDocsDefault: DocItem[] = [
    {
        name: "Exclusive Buyer Representation Agreement (Designated Agency)",
        key: "EBRADA",
    },
    {
        name: "Exclusive Buyer Representation Agreement Amendment",
        key: "EBRAA",
    },
    {
        name: "Exclusive Buyer Representation Agreement Termination (Designated Agency)",
        key: "EBRATDA",
    },
    {
        name: "Residential Purchase Contract",
        key: "RPC",
    },
];

const sellingDocsDefault: DocItem[] = [
    {
        name: "Seller Customer Status Acknowledgment and Fee Agreement",
        key: "SCSAAFA",
    },
    {
        name: "CREB® - Illegal Drug Manufacture_Marijuana Grow Operation Listing",
        key: "IDMMGOL",
    },
    {
        name: "Exclusive Seller Representation Agreement Amendment",
        key: "ESRAA",
    },
];


// ============================================================
// AML HELPERS
// ============================================================

const getFintracAmlTriggers = (
    data?: ClientFintrac | null
): string[] => {
    if (!data) {
        return [];
    }

    const triggers: string[] = [];

    if (
        String(
            data.clientPoliticallyExposed || ""
        ).toLowerCase() === "yes"
    ) {
        triggers.push(
            "politicallyExposed"
        );
    }

    if (
        String(
            data.clientFamilyGovernment || ""
        ).toLowerCase() === "yes"
    ) {
        triggers.push(
            "familyPoliticallyExposed"
        );
    }

    if (
        String(
            data.clientThirdParty || ""
        ).toLowerCase() === "yes"
    ) {
        triggers.push(
            "thirdPartyConducted"
        );
    }

    return triggers;
};


const normalizeClientFintracData = (
    ...sources: any[]
): ClientFintrac | null => {
    const candidates: any[] = [];

    const addCandidate = (
        value: any
    ) => {
        if (!value) {
            return;
        }

        candidates.push(value);

        if (value.data) {
            candidates.push(value.data);
        }

        if (value.fintrac) {
            candidates.push(value.fintrac);
        }

        if (value.clientFintrac) {
            candidates.push(
                value.clientFintrac
            );
        }

        if (value.clientFINTRAC) {
            candidates.push(
                value.clientFINTRAC
            );
        }

        if (value.fintracData) {
            candidates.push(
                value.fintracData
            );
        }
    };

    sources.forEach(addCandidate);

    const readValue = (
        keys: string[]
    ): any => {
        for (const candidate of candidates) {
            for (const key of keys) {
                const value =
                    candidate?.[key];

                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {
                    return value;
                }
            }
        }

        return "";
    };

    const politicallyExposed =
        String(
            readValue([
                "clientPoliticallyExposed",
                "politicallyExposed",
                "politicallyExposedIndividual",
                "politically_exposed",
                "isPoliticallyExposed",
            ])
        ).toLowerCase();

    const familyGovernment =
        String(
            readValue([
                "clientFamilyGovernment",
                "familyPoliticallyExposed",
                "familyGovernment",
                "familyMemberGovernment",
                "familyPoliticallyExposedIndividual",
                "isFamilyPoliticallyExposed",
            ])
        ).toLowerCase();

    const thirdParty =
        String(
            readValue([
                "clientThirdParty",
                "thirdPartyConducted",
                "thirdParty",
                "actingOnBehalfOfThirdParty",
                "isThirdParty",
            ])
        ).toLowerCase();

    const hasAnyAnswer =
        Boolean(
            politicallyExposed ||
            familyGovernment ||
            thirdParty
        );

    if (!hasAnyAnswer) {
        return null;
    }

    const normalizeYesNo = (
        value: string
    ) => {
        if (
            value === "yes" ||
            value === "true" ||
            value === "1"
        ) {
            return "yes";
        }

        if (
            value === "no" ||
            value === "false" ||
            value === "0"
        ) {
            return "no";
        }

        return "";
    };

    return {
        clientPoliticallyExposed:
            normalizeYesNo(
                politicallyExposed
            ),

        clientFamilyGovernment:
            normalizeYesNo(
                familyGovernment
            ),

        clientThirdParty:
            normalizeYesNo(
                thirdParty
            ),

        dilisenseReport:
            candidates.find(
                candidate =>
                    candidate?.dilisenseReport
            )?.dilisenseReport ||
            null,

        amlScreening:
            candidates.find(
                candidate =>
                    candidate?.amlScreening
            )?.amlScreening ||
            null,

        aml:
            candidates.find(
                candidate =>
                    candidate?.aml
            )?.aml ||
            null,
    };
};


const normalizeAmlStatus = (
    screening?: AmlScreening | null,
    report?: DiliSenseReport | null,
    amlRequired = false
) => {
    const screeningStatus =
        String(
            screening?.status || ""
        )
            .trim()
            .toLowerCase();

    const reportStatus =
        String(
            report?.status || ""
        )
            .trim()
            .toLowerCase();

    if (
        report?.generated === true ||
        reportStatus === "generated"
    ) {
        return "generated";
    }

    if (screeningStatus) {
        return screeningStatus;
    }

    if (reportStatus) {
        return reportStatus;
    }

    return amlRequired
        ? "pending"
        : "not_required";
};


const getAmlStatusLabel = (
    status?: string
) => {
    switch (
        String(status || "").toLowerCase()
    ) {
        case "generated":
            return "Report Generated";

        case "screened":
            return "Screening Completed";

        case "completed":
            return "Screening Completed";

        case "matched":
            return "Potential Match Found";

        case "hits_found":
            return "Potential Matches Found";

        case "processing":
            return "Screening Processing";

        case "pending":
            return "Screening Pending";

        case "failed":
            return "Screening Failed";

        case "not_required":
            return "Not Required";

        default:
            return status || "Unknown";
    }
};


const isAmlCompleted = (
    screening?: AmlScreening | null,
    report?: DiliSenseReport | null
) => {
    const status =
        String(
            screening?.status ||
            report?.status ||
            ""
        ).toLowerCase();

    return (
        status === "screened" ||
        status === "completed" ||
        status === "generated" ||
        status === "matched" ||
        status === "hits_found" ||
        report?.generated === true
    );
};


const getAmlHitCount = (
    screening?: AmlScreening | null,
    report?: DiliSenseReport | null
) => {
    if (
        typeof screening?.totalHits ===
        "number"
    ) {
        return screening.totalHits;
    }

    if (
        typeof report?.totalHits ===
        "number"
    ) {
        return report.totalHits;
    }

    if (
        Array.isArray(
            screening?.hits
        )
    ) {
        return screening.hits.length;
    }

    if (
        Array.isArray(
            report?.hits
        )
    ) {
        return report.hits.length;
    }

    return 0;
};


const cleanSearchedName = (
    value?: string
) => {
    if (!value) {
        return "";
    }

    return String(value)
        .replace(
            /^\s*name\s*:\s*/i,
            ""
        )
        .split(
            /\s+-\s+(?:entityType|dob|gender|fuzzy(?:[_ ]search)?|entity)/i
        )[0]
        .trim();
};


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
    status,
}: {
    status: string;
}) {
    const isFilled =
        status === "Filled";

    return (
        <View
            className={`flex-row items-center rounded-full border px-3 py-1.5 ${
                isFilled
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
            }`}
        >
            <View
                className={`mr-2 h-2 w-2 rounded-full ${
                    isFilled
                        ? "bg-green-500"
                        : "bg-red-500"
                }`}
            />

            <Text
                className={`text-xs font-semibold ${
                    isFilled
                        ? "text-green-700"
                        : "text-red-700"
                }`}
            >
                {status}
            </Text>
        </View>
    );
}


// ============================================================
// SIGNATURE PROGRESS MODAL
// ============================================================

function SignatureStatus({
    doc,
    partyId,
    onClose,
}: {
    doc: DocItem;
    partyId: string;
    onClose: () => void;
}) {
    const signingStatus =
        doc.signingStatus;

    const [
        sendingRecipientId,
        setSendingRecipientId,
    ] = useState<string | null>(
        null
    );

    if (!signingStatus) {
        return null;
    }

    const resendReminder = async (
        signer: SignerStatus
    ) => {
        try {
            if (!partyId) {
                Alert.alert(
                    "Error",
                    "Party ID not found."
                );
                return;
            }

            if (!signer.recipientId) {
                Alert.alert(
                    "Error",
                    "Recipient ID not found."
                );
                return;
            }

            setSendingRecipientId(
                signer.recipientId
            );

            const response =
                await fetch(
                    `${API_BASE}/docusign/remind-signer`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            partyId,
                            documentType:
                                doc.key,
                            recipientId:
                                signer.recipientId,
                        }),
                    }
                );

            let data: any;

            try {
                data =
                    await response.json();
            } catch {
                throw new Error(
                    "Invalid server response."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to send reminder."
                );
            }

            Alert.alert(
                "Reminder Sent",
                data?.message ||
                "Reminder email sent successfully."
            );
        } catch (error: any) {
            console.error(
                "Reminder Error:",
                error
            );

            Alert.alert(
                "Error",
                error?.message ||
                "Unable to send reminder."
            );
        } finally {
            setSendingRecipientId(
                null
            );
        }
    };

    const percentage =
        Math.round(
            (
                signingStatus.completed /
                Math.max(
                    signingStatus.total,
                    1
                )
            ) * 100
        );

    return (
        <View className="rounded-t-3xl bg-white">

            <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-5">

                <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-800">
                        Signature Progress
                    </Text>

                    <Text className="mt-1 text-sm text-gray-500">
                        Track document signatures
                    </Text>
                </View>

                <Pressable
                    onPress={onClose}
                    className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100"
                >
                    <X
                        size={20}
                        color="#374151"
                    />
                </Pressable>

            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: 35,
                }}
            >

                <View className="mb-5 rounded-2xl bg-gray-50 p-4">

                    <View className="flex-row items-center justify-between">

                        <Text className="text-sm font-semibold text-gray-700">
                            Signatures
                        </Text>

                        <Text className="text-lg font-bold text-[#9a6a3a]">
                            {
                                signingStatus.completed
                            }
                            /
                            {
                                signingStatus.total
                            }
                        </Text>

                    </View>

                    <View className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">

                        <View
                            className="h-full rounded-full bg-green-500"
                            style={{
                                width:
                                    `${percentage}%`,
                            }}
                        />

                    </View>

                    <Text className="mt-2 text-xs text-gray-500">
                        {percentage}% completed
                    </Text>

                </View>

                <View className="gap-3">

                    {signingStatus.signers.map(
                        (
                            signer,
                            index
                        ) => {

                            const isSending =
                                sendingRecipientId ===
                                signer.recipientId;

                            return (
                                <View
                                    key={
                                        signer.recipientId ||
                                        `${signer.role}-${index}`
                                    }
                                    className="rounded-2xl border border-gray-200 bg-white p-4"
                                >

                                    <View className="flex-row items-start">

                                        {signer.signed ? (
                                            <CheckCircle2
                                                size={21}
                                                color="#22c55e"
                                            />
                                        ) : (
                                            <Clock3
                                                size={21}
                                                color="#eab308"
                                            />
                                        )}

                                        <View className="ml-3 flex-1">

                                            <View className="flex-row items-start justify-between">

                                                <View className="flex-1 pr-2">

                                                    <Text className="text-sm font-semibold text-gray-800">
                                                        {
                                                            signer.role
                                                        }
                                                    </Text>

                                                    {signer.name && (
                                                        <Text className="mt-1 text-xs text-gray-600">
                                                            {
                                                                signer.name
                                                            }
                                                        </Text>
                                                    )}

                                                    {signer.email && (
                                                        <Text className="mt-1 text-xs text-gray-500">
                                                            {
                                                                signer.email
                                                            }
                                                        </Text>
                                                    )}

                                                </View>

                                                <View
                                                    className={`rounded-full px-2.5 py-1 ${
                                                        signer.signed
                                                            ? "bg-green-100"
                                                            : "bg-yellow-100"
                                                    }`}
                                                >
                                                    <Text
                                                        className={`text-xs font-semibold ${
                                                            signer.signed
                                                                ? "text-green-700"
                                                                : "text-yellow-700"
                                                        }`}
                                                    >
                                                        {signer.signed
                                                            ? "Signed"
                                                            : "Pending"}
                                                    </Text>
                                                </View>

                                            </View>

                                            {!signer.signed &&
                                                (
                                                    signer.recipientId ? (
                                                        <Pressable
                                                            disabled={
                                                                isSending
                                                            }
                                                            onPress={() =>
                                                                resendReminder(
                                                                    signer
                                                                )
                                                            }
                                                            className="mt-3 h-10 items-center justify-center rounded-xl bg-blue-600"
                                                        >
                                                            {isSending ? (
                                                                <ActivityIndicator
                                                                    size="small"
                                                                    color="#ffffff"
                                                                />
                                                            ) : (
                                                                <Text className="text-xs font-semibold text-white">
                                                                    Send Reminder
                                                                </Text>
                                                            )}
                                                        </Pressable>
                                                    ) : (
                                                        <View className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                                                            <Text className="text-center text-xs font-medium text-amber-700">
                                                                You haven't sent this document for signature yet.
                                                            </Text>
                                                        </View>
                                                    )
                                                )}

                                        </View>

                                    </View>

                                </View>
                            );
                        }
                    )}

                </View>

            </ScrollView>

        </View>
    );
}


// ============================================================
// DOCUMENT CARD
// ============================================================

function DocumentRow({
    doc,
    partyId,
    onOpen,
    onSendForSign,
    onSignaturePress,
    sending,
}: {
    doc: DocItem;
    partyId: string;
    onOpen: () => void;
    onSendForSign: () => void;
    onSignaturePress: () => void;
    sending: boolean;
}) {
    const canSendForSign =
        ![
            "fintrac",
            "pep",
        ].includes(
            doc.key ?? ""
        );

    const isFilled =
        doc.status === "Filled";

    return (
        <View className="rounded-2xl border border-gray-200 bg-white p-4">

            <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Document Name
            </Text>

            <Text className="text-base font-semibold leading-6 text-gray-800">
                {doc.name}
            </Text>

            <View className="mt-4 flex-row items-center justify-between">

                <StatusBadge
                    status={
                        doc.status ||
                        "Not Filled"
                    }
                />

                {doc.signingStatus && (
                    <Pressable
                        onPress={
                            onSignaturePress
                        }
                        className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                        <Text className="mr-2 text-xs font-semibold text-gray-700">
                            {
                                doc.signingStatus
                                    .completed
                            }
                            /
                            {
                                doc.signingStatus
                                    .total
                            }{" "}
                            Signed
                        </Text>

                        <ChevronDown
                            size={15}
                            color="#6b7280"
                        />
                    </Pressable>
                )}

            </View>

            <View className="mt-4 gap-3">

                <Pressable
                    onPress={onOpen}
                    className="h-12 flex-row items-center justify-center rounded-xl bg-[#9a6a3a]"
                >
                    <ExternalLink
                        size={17}
                        color="#ffffff"
                    />

                    <Text className="ml-2 text-sm font-semibold text-white">
                        Open
                    </Text>
                </Pressable>

                {canSendForSign && (
                    <Pressable
                        disabled={
                            !isFilled ||
                            sending
                        }
                        onPress={
                            onSendForSign
                        }
                        className={`h-12 flex-row items-center justify-center rounded-xl ${
                            isFilled
                                ? "bg-blue-600"
                                : "bg-gray-300"
                        }`}
                    >
                        {sending ? (
                            <ActivityIndicator
                                size="small"
                                color="#ffffff"
                            />
                        ) : (
                            <Text className="text-sm font-semibold text-white">
                                Send for Sign
                            </Text>
                        )}
                    </Pressable>
                )}

            </View>

        </View>
    );
}


// ============================================================
// AML REPORT WEBSITE MODAL
// ============================================================

function AmlReportWebsite({
    visible,
    onClose,
    partyId,
    screening,
    report,
}: {
    visible: boolean;
    onClose: () => void;
    partyId: string;
    screening?: AmlScreening | null;
    report?: DiliSenseReport | null;
}) {
    const searchedName =
        cleanSearchedName(
            screening?.searchedName ||
            report?.searchedName
        );

    const searchedDob =
        screening?.searchedDob ||
        report?.searchedDob ||
        "";

    const searchedGender =
        screening?.searchedGender ||
        report?.searchedGender ||
        "";

    const provider =
        screening?.provider ||
        report?.provider ||
        "DiliSense";

    const requestId =
        screening?.requestId ||
        report?.requestId ||
        "";

    const screeningId =
        screening?.screeningId ||
        report?.screeningId ||
        "";

    const riskLevel =
        screening?.riskLevel ||
        report?.riskLevel ||
        "";

    const result =
        screening?.result ||
        report?.result ||
        "";

    const hitCount =
        getAmlHitCount(
            screening,
            report
        );

    const matchFound =
        screening?.matched === true ||
        screening?.matchFound === true ||
        report?.matched === true ||
        report?.matchFound === true ||
        hitCount > 0;

    const hits =
        screening?.hits ||
        report?.hits ||
        [];

    const status =
        normalizeAmlStatus(
            screening,
            report,
            true
        );

    const completedAt =
        screening?.completedAt ||
        screening?.screenedAt ||
        screening?.generatedAt ||
        report?.completedAt ||
        report?.screenedAt ||
        report?.generatedAt ||
        null;

    const triggeredBy =
        report?.triggeredBy ||
        [];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >

            <View className="flex-1 bg-gray-100">

                {/* ==================================================
                    WEBSITE HEADER
                ================================================== */}

                <View className="border-b border-gray-200 bg-white px-5 pb-4 pt-14">

                    <View className="flex-row items-center justify-between">

                        <View className="flex-row items-center">

                            <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#B8860B]/10">
                                <Shield
                                    size={22}
                                    color="#B8860B"
                                />
                            </View>

                            <View className="ml-3">

                                <Text className="text-lg font-bold text-gray-800">
                                    AML Screening Report
                                </Text>

                                <Text className="mt-0.5 text-xs text-gray-500">
                                    DiliSense Screening
                                </Text>

                            </View>

                        </View>

                        <Pressable
                            onPress={onClose}
                            className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100"
                        >
                            <X
                                size={20}
                                color="#374151"
                            />
                        </Pressable>

                    </View>

                </View>


                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        padding: 16,
                        paddingBottom: 40,
                    }}
                >

                    {/* ==================================================
                        REPORT TITLE
                    ================================================== */}

                    <View className="rounded-3xl border border-gray-200 bg-white p-5">

                        <View className="flex-row items-start">

                            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#1f3a56]">
                                <FileText
                                    size={23}
                                    color="#ffffff"
                                />
                            </View>

                            <View className="ml-3 flex-1">

                                <Text className="text-xl font-bold text-gray-800">
                                    DiliSense AML Screening
                                </Text>

                                <Text className="mt-1 text-sm leading-5 text-gray-500">
                                    Administrative AML screening report for the selected client.
                                </Text>

                            </View>

                        </View>

                        <View className="mt-5 flex-row flex-wrap gap-2">

                            <View
                                className={`rounded-full px-3 py-1.5 ${
                                    matchFound
                                        ? "bg-amber-100"
                                        : "bg-green-100"
                                }`}
                            >
                                <Text
                                    className={`text-xs font-bold ${
                                        matchFound
                                            ? "text-amber-700"
                                            : "text-green-700"
                                    }`}
                                >
                                    {matchFound
                                        ? "Potential Match Found"
                                        : "No Match Indicated"}
                                </Text>
                            </View>

                            <View className="rounded-full bg-gray-100 px-3 py-1.5">
                                <Text className="text-xs font-bold text-gray-700">
                                    {getAmlStatusLabel(
                                        status
                                    )}
                                </Text>
                            </View>

                        </View>

                    </View>


                    {/* ==================================================
                        SEARCHED PERSON
                    ================================================== */}

                    <View className="mt-5 rounded-3xl border border-gray-200 bg-white">

                        <View className="border-b border-gray-200 bg-gray-50 px-5 py-4">

                            <Text className="font-bold text-gray-800">
                                Search Information
                            </Text>

                        </View>

                        <View className="p-5">

                            <View className="border-b border-gray-100 py-3">
                                <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Searched Name
                                </Text>

                                <Text className="mt-1 text-sm font-semibold text-gray-800">
                                    {searchedName || "-"}
                                </Text>
                            </View>

                            <View className="border-b border-gray-100 py-3">
                                <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Date of Birth
                                </Text>

                                <Text className="mt-1 text-sm font-semibold text-gray-800">
                                    {searchedDob || "-"}
                                </Text>
                            </View>

                            {searchedGender ? (
                                <View className="border-b border-gray-100 py-3">
                                    <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Gender
                                    </Text>

                                    <Text className="mt-1 text-sm font-semibold text-gray-800">
                                        {searchedGender}
                                    </Text>
                                </View>
                            ) : null}

                            <View className="border-b border-gray-100 py-3">
                                <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Provider
                                </Text>

                                <Text className="mt-1 text-sm font-semibold text-gray-800">
                                    {provider}
                                </Text>
                            </View>

                            {riskLevel ? (
                                <View className="py-3">
                                    <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Risk Level
                                    </Text>

                                    <Text className="mt-1 text-sm font-semibold text-gray-800">
                                        {riskLevel}
                                    </Text>
                                </View>
                            ) : null}

                        </View>

                    </View>


                    {/* ==================================================
                        SCREENING DETAILS
                    ================================================== */}

                    {(requestId ||
                        screeningId ||
                        completedAt) && (
                        <View className="mt-5 rounded-3xl border border-gray-200 bg-white">

                            <View className="border-b border-gray-200 bg-gray-50 px-5 py-4">

                                <Text className="font-bold text-gray-800">
                                    Screening Details
                                </Text>

                            </View>

                            <View className="p-5">

                                {requestId ? (
                                    <View className="border-b border-gray-100 py-3">
                                        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                            Request ID
                                        </Text>

                                        <Text className="mt-1 text-sm font-medium text-gray-800">
                                            {requestId}
                                        </Text>
                                    </View>
                                ) : null}

                                {screeningId ? (
                                    <View className="border-b border-gray-100 py-3">
                                        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                            Screening ID
                                        </Text>

                                        <Text className="mt-1 text-sm font-medium text-gray-800">
                                            {screeningId}
                                        </Text>
                                    </View>
                                ) : null}

                                {completedAt ? (
                                    <View className="py-3">
                                        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                            Completed At
                                        </Text>

                                        <Text className="mt-1 text-sm font-medium text-gray-800">
                                            {String(
                                                completedAt
                                            )}
                                        </Text>
                                    </View>
                                ) : null}

                            </View>

                        </View>
                    )}


                    {/* ==================================================
                        RESULT
                    ================================================== */}

                    <View
                        className={`mt-5 rounded-3xl border p-5 ${
                            matchFound
                                ? "border-amber-200 bg-amber-50"
                                : "border-green-200 bg-green-50"
                        }`}
                    >

                        <View className="flex-row items-start">

                            {matchFound ? (
                                <AlertTriangle
                                    size={25}
                                    color="#d97706"
                                />
                            ) : (
                                <CheckCircle2
                                    size={25}
                                    color="#16a34a"
                                />
                            )}

                            <View className="ml-3 flex-1">

                                <Text
                                    className={`text-lg font-bold ${
                                        matchFound
                                            ? "text-amber-800"
                                            : "text-green-800"
                                    }`}
                                >
                                    {matchFound
                                        ? "Potential AML Match Found"
                                        : "No Match Indicated"}
                                </Text>

                                <Text
                                    className={`mt-1 text-sm ${
                                        matchFound
                                            ? "text-amber-700"
                                            : "text-green-700"
                                    }`}
                                >
                                    Screening records returned:{" "}
                                    <Text className="font-bold">
                                        {hitCount}
                                    </Text>
                                </Text>

                            </View>

                        </View>

                        {result ? (
                            <View className="mt-4 border-t border-black/10 pt-4">

                                <Text className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                    Provider Result
                                </Text>

                                <Text className="mt-1 text-sm font-medium text-gray-800">
                                    {result}
                                </Text>

                            </View>
                        ) : null}

                    </View>


                    {/* ==================================================
                        TRIGGERED BY
                    ================================================== */}

                    {triggeredBy.length > 0 && (
                        <View className="mt-5 rounded-3xl border border-red-100 bg-white p-5">

                            <Text className="mb-3 font-bold text-gray-800">
                                Screening Triggered By
                            </Text>

                            <View className="gap-2">

                                {triggeredBy.map(
                                    trigger => (
                                        <View
                                            key={trigger}
                                            className="flex-row items-center rounded-xl border border-red-100 bg-red-50 px-3 py-3"
                                        >

                                            <AlertTriangle
                                                size={17}
                                                color="#dc2626"
                                            />

                                            <Text className="ml-2 flex-1 text-xs font-bold text-red-700">
                                                {trigger ===
                                                "politicallyExposed"
                                                    ? "Politically Exposed Individual"
                                                    : trigger ===
                                                      "familyPoliticallyExposed"
                                                    ? "Family Member in Government / Politics"
                                                    : trigger ===
                                                      "thirdPartyConducted"
                                                    ? "Acting on Behalf of a Third Party"
                                                    : trigger}
                                            </Text>

                                        </View>
                                    )
                                )}

                            </View>

                        </View>
                    )}


                    {/* ==================================================
                        MATCHES
                    ================================================== */}

                    {hits.length > 0 && (
                        <View className="mt-5">

                            <Text className="mb-3 px-1 text-base font-bold text-gray-800">
                                Screening Matches
                            </Text>

                            <View className="gap-3">

                                {hits.map(
                                    (
                                        hit,
                                        index
                                    ) => (
                                        <View
                                            key={index}
                                            className="rounded-3xl border border-amber-200 bg-amber-50 p-5"
                                        >

                                            <Text className="text-base font-bold text-gray-800">
                                                {hit.name ||
                                                    "Potential Match"}
                                            </Text>

                                            {hit.category ? (
                                                <Text className="mt-2 text-xs text-gray-600">
                                                    Category:{" "}
                                                    <Text className="font-semibold">
                                                        {
                                                            hit.category
                                                        }
                                                    </Text>
                                                </Text>
                                            ) : null}

                                            {hit.source ? (
                                                <Text className="mt-1 text-xs text-gray-600">
                                                    Source:{" "}
                                                    <Text className="font-semibold">
                                                        {
                                                            hit.source
                                                        }
                                                    </Text>
                                                </Text>
                                            ) : null}

                                            {hit.matchType ? (
                                                <Text className="mt-1 text-xs text-gray-600">
                                                    Match Type:{" "}
                                                    <Text className="font-semibold">
                                                        {
                                                            hit.matchType
                                                        }
                                                    </Text>
                                                </Text>
                                            ) : null}

                                            {hit.details ? (
                                                <Text className="mt-3 text-sm leading-5 text-gray-700">
                                                    {
                                                        hit.details
                                                    }
                                                </Text>
                                            ) : null}

                                            {typeof hit.score ===
                                                "number" && (
                                                <View className="mt-3 self-start rounded-full bg-white px-3 py-1.5">
                                                    <Text className="text-xs font-bold text-gray-700">
                                                        Score:{" "}
                                                        {
                                                            hit.score
                                                        }
                                                    </Text>
                                                </View>
                                            )}

                                        </View>
                                    )
                                )}

                            </View>

                        </View>
                    )}


                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    <View className="mt-6 rounded-2xl bg-[#1f3a56] p-5">

                        <View className="flex-row items-center">

                            <Shield
                                size={20}
                                color="#ffffff"
                            />

                            <Text className="ml-2 font-bold text-white">
                                AML Screening Report
                            </Text>

                        </View>

                        <Text className="mt-2 text-xs leading-5 text-white/80">
                            This report displays AML screening information returned by the configured DiliSense integration.
                        </Text>

                    </View>

                </ScrollView>

            </View>

        </Modal>
    );
}


// ============================================================
// MAIN SCREEN
// ============================================================

export default function Partiespdfdata() {

    const router =
        useRouter();

    const params =
        useLocalSearchParams<{
            id?: string;
        }>();

    const id =
        typeof params.id ===
        "string"
            ? params.id
            : Array.isArray(
                params.id
            )
                ? params.id[0]
                : undefined;

    const {
        user,
        loading: authLoading,
    } = useAuth();


    // ========================================================
    // DOCUMENT STATE
    // ========================================================

    const [general, setGeneral] =
        useState<DocItem[]>(
            generalDocs
        );

    const [buying, setBuying] =
        useState<DocItem[]>(
            buyingDocsDefault
        );

    const [selling, setSelling] =
        useState<DocItem[]>(
            sellingDocsDefault
        );


    // ========================================================
    // FINTRAC + AML
    // ========================================================

    const [
        clientFintrac,
        setClientFintrac,
    ] = useState<ClientFintrac | null>(
        null
    );

    const [
        generatingAmlReport,
        setGeneratingAmlReport,
    ] = useState(false);

    const [
        showAmlReport,
        setShowAmlReport,
    ] = useState(false);


    // ========================================================
    // UPLOADED DOCUMENTS
    // ========================================================

    const [
        docs,
        setDocs,
    ] = useState<UploadedDocs>(
        {}
    );


    // ========================================================
    // MODALS
    // ========================================================

    const [
        showUploadedDocs,
        setShowUploadedDocs,
    ] = useState(false);

    const [
        previewImage,
        setPreviewImage,
    ] = useState<string | null>(
        null
    );

    const [
        signatureDoc,
        setSignatureDoc,
    ] = useState<DocItem | null>(
        null
    );


    // ========================================================
    // SENDING
    // ========================================================

    const [
        sendingDoc,
        setSendingDoc,
    ] = useState<string | null>(
        null
    );


    // ============================================================
    // FETCH ALL DATA
    // ============================================================

    const fetchData =
        useCallback(async () => {

            if (!id) {
                return;
            }

            try {

                const [
                    fintracRes,
                    pepRes,
                    crgRes,
                    docsRes,
                    clientFintracRes,
                    partyRes,
                ] = await Promise.all([

                    fetch(
                        `${API_BASE}/fintracpdf/fintrac/user/${id}`
                    ),

                    fetch(
                        `${API_BASE}/fintracpeppdf/pep/user/${id}`
                    ),

                    fetch(
                        `${API_BASE}/crgpdf/crg/user/${id}`
                    ),

                    fetch(
                        `${API_BASE}/statuspdf/document-status/${id}`
                    ),

                    fetch(
                        `${API_BASE}/fintracpdf/client/${id}`
                    ),

                    fetch(
                        `${API_BASE}/transactions/parties/party/${id}`
                    ),

                ]);


                const [
                    fintracData,
                    pepData,
                    crgData,
                    docsData,
                    clientFintracJson,
                    partyData,
                ] = await Promise.all([

                    fintracRes.json(),

                    pepRes.json(),

                    crgRes.json(),

                    docsRes.json(),

                    clientFintracRes.json(),

                    partyRes.json(),

                ]);


                console.log(
                    "Document Status:",
                    docsData
                );

                console.log(
                    "Client FINTRAC:",
                    clientFintracJson
                );


                // ==================================================
                // CLIENT FINTRAC + AML
                // ==================================================

                const normalizedFintrac =
                    normalizeClientFintracData(
                        clientFintracJson?.data,
                        clientFintracJson,
                        fintracData?.data,
                        fintracData
                    );

                if (
                    normalizedFintrac
                ) {

                    const triggers =
                        getFintracAmlTriggers(
                            normalizedFintrac
                        );

                    const existingReport =
                        normalizedFintrac
                            .dilisenseReport ||
                        null;

                    const existingScreening =
                        normalizedFintrac
                            .amlScreening ||
                        normalizedFintrac
                            .aml ||
                        null;

                    const normalizedReport =
                        existingReport
                            ? {
                                ...existingReport,

                                status:
                                    existingReport.status ||
                                    (
                                        existingReport.generated
                                            ? "generated"
                                            : triggers.length
                                                ? "pending"
                                                : "not_required"
                                    ),

                                triggeredBy:
                                    existingReport
                                        .triggeredBy
                                        ?.length
                                        ? existingReport.triggeredBy
                                        : triggers,
                            }
                            : triggers.length
                                ? {
                                    status:
                                        "pending",
                                    generated:
                                        false,
                                    triggeredBy:
                                        triggers,
                                }
                                : null;

                    const normalizedScreening =
                        existingScreening
                            ? {
                                ...existingScreening,

                                required:
                                    existingScreening.required ===
                                    true
                                        ? true
                                        : triggers.length >
                                          0,
                            }
                            : triggers.length
                                ? {
                                    required:
                                        true,
                                    status:
                                        "pending",
                                }
                                : null;

                    setClientFintrac({
                        ...normalizedFintrac,

                        dilisenseReport:
                            normalizedReport,

                        amlScreening:
                            normalizedScreening,

                        aml:
                            normalizedScreening,
                    });

                } else {

                    setClientFintrac(
                        null
                    );

                }


                // ==================================================
                // GENERAL
                // ==================================================

                setGeneral(
                    previous =>
                        previous.map(
                            doc => {

                                if (
                                    doc.key ===
                                    "fintrac"
                                ) {
                                    return {
                                        ...doc,
                                        status:
                                            fintracData?.data
                                                ? "Filled"
                                                : "Not Filled",
                                    };
                                }

                                if (
                                    doc.key ===
                                    "pep"
                                ) {
                                    return {
                                        ...doc,
                                        status:
                                            pepData?.data
                                                ? "Filled"
                                                : "Not Filled",
                                    };
                                }

                                if (
                                    doc.key ===
                                    "crg"
                                ) {
                                    return {
                                        ...doc,

                                        status:
                                            docsData
                                                ?.data
                                                ?.crg
                                                ?.filled
                                                ? "Filled"
                                                : "Not Filled",

                                        signingStatus:
                                            docsData
                                                ?.data
                                                ?.crg
                                                ?.signing ||
                                            null,

                                        envelopeId:
                                            docsData
                                                ?.data
                                                ?.crg
                                                ?.envelopeId ||
                                            null,
                                    };
                                }

                                return doc;
                            }
                        )
                );


                // ==================================================
                // BUYING
                // ==================================================

                if (
                    docsData?.data
                ) {

                    setBuying(
                        previous =>
                            previous.map(
                                doc => ({
                                    ...doc,

                                    status:
                                        docsData
                                            .data[
                                            doc.key!
                                        ]
                                            ?.filled
                                            ? "Filled"
                                            : "Not Filled",

                                    signingStatus:
                                        docsData
                                            .data[
                                            doc.key!
                                        ]
                                            ?.signing ||
                                        null,

                                    envelopeId:
                                        docsData
                                            .data[
                                            doc.key!
                                        ]
                                            ?.envelopeId ||
                                        null,
                                })
                            )
                    );


                    // ==================================================
                    // SELLING
                    // ==================================================

                    setSelling(
                        previous =>
                            previous.map(
                                doc => ({
                                    ...doc,

                                    status:
                                        docsData
                                            .data[
                                            doc.key!
                                        ]
                                            ?.filled
                                            ? "Filled"
                                            : "Not Filled",

                                    signingStatus:
                                        docsData
                                            .data[
                                            doc.key!
                                        ]
                                            ?.signing ||
                                        null,

                                    envelopeId:
                                        docsData
                                            .data[
                                            doc.key!
                                        ]
                                            ?.envelopeId ||
                                        null,
                                })
                            )
                    );

                }


                // ==================================================
                // UPLOADED DOCUMENTS
                // ==================================================

                if (
                    partyData?.party
                ) {

                    setDocs({
                        licenseImage:
                            partyData
                                .party
                                .licenseImage,

                        passportImage:
                            partyData
                                .party
                                .passportImage,
                    });

                } else {

                    setDocs({});

                }

            } catch (error) {

                console.error(
                    "Failed to fetch party data:",
                    error
                );

            }

        }, [id]);


    // ============================================================
    // AUTO REFRESH EVERY 3 SECONDS
    // ============================================================

    useEffect(() => {

        if (
            authLoading ||
            !id ||
            !user
        ) {
            return;
        }

        let cancelled =
            false;

        let timeoutId:
            ReturnType<
                typeof setTimeout
            >;

        const run = async () => {

            if (cancelled) {
                return;
            }

            await fetchData();

            if (!cancelled) {

                timeoutId =
                    setTimeout(
                        run,
                        3000
                    );

            }

        };

        run();

        return () => {

            cancelled =
                true;

            clearTimeout(
                timeoutId
            );

        };

    }, [
        authLoading,
        user,
        id,
        fetchData,
    ]);


    // ============================================================
    // MANUAL AML GENERATION
    // ============================================================

    const handleGenerateAmlReport =
        async (
            regenerate = false
        ) => {

            if (!id) {
                Alert.alert(
                    "Error",
                    "Party ID not found."
                );
                return;
            }

            if (
                generatingAmlReport
            ) {
                return;
            }

            const confirmed =
                await new Promise<boolean>(
                    resolve => {

                        Alert.alert(
                            regenerate
                                ? "Regenerate AML Report"
                                : "Generate AML Report",

                            regenerate
                                ? "A new DiliSense AML screening will be performed and the existing report will be replaced."
                                : "Generate a DiliSense AML screening report manually for this client?",

                            [
                                {
                                    text:
                                        "Cancel",
                                    style:
                                        "cancel",
                                    onPress:
                                        () =>
                                            resolve(
                                                false
                                            ),
                                },
                                {
                                    text:
                                        regenerate
                                            ? "Regenerate"
                                            : "Generate",
                                    onPress:
                                        () =>
                                            resolve(
                                                true
                                            ),
                                },
                            ]
                        );

                    }
                );

            if (!confirmed) {
                return;
            }

            try {

                setGeneratingAmlReport(
                    true
                );

                const response =
                    await fetch(
                        `${API_BASE}/fintracpdf/client/${id}/dilisense-admin-generate`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    reason:
                                        regenerate
                                            ? "Administrator manually regenerated the DiliSense AML screening report"
                                            : "Administrator manually requested AML screening",
                                }),
                        }
                    );

                let data: any;

                try {
                    data =
                        await response.json();
                } catch {
                    throw new Error(
                        "Invalid server response."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        "Unable to generate AML report."
                    );
                }

                Alert.alert(
                    "Success",
                    data?.message ||
                    (
                        regenerate
                            ? "AML report regenerated successfully."
                            : "AML report generated successfully."
                    )
                );

                await fetchData();

            } catch (
                error: any
            ) {

                console.error(
                    "AML generation error:",
                    error
                );

                Alert.alert(
                    "AML Error",
                    error?.message ||
                    "Unable to generate AML report."
                );

            } finally {

                setGeneratingAmlReport(
                    false
                );

            }

        };


    // ============================================================
    // OPEN AML PDF
    // ============================================================

    const openAmlPdf = async () => {

        if (!id) {
            return;
        }

        const reportUrl =
            `${API_BASE}/fintracpdf/client/${id}/dilisense-report`;

        try {

            const supported =
                await Linking.canOpenURL(
                    reportUrl
                );

            if (!supported) {

                Alert.alert(
                    "Unavailable",
                    "Unable to open the AML report."
                );

                return;
            }

            await Linking.openURL(
                reportUrl
            );

        } catch (error) {

            console.error(
                "Open AML report error:",
                error
            );

            Alert.alert(
                "Error",
                "Unable to open AML report."
            );

        }

    };


    // ============================================================
    // OPEN DOCUMENT
    // ============================================================

    const handleOpen = (
        doc: DocItem,
        mode = "admin"
    ) => {

        if (!id) {
            return;
        }

        switch (
            doc.key
        ) {

            case "fintrac":
                router.push(
                    `/(transactions)/party/fintrac/${id}?mode=${mode}` as any
                );
                break;

            case "pep":
                router.push(
                    `/(transactions)/party/politically-exposed/${id}?mode=${mode}` as any
                );
                break;

            case "crg":
                router.push(
                    `/(transactions)/party/crg/${id}?mode=${mode}` as any
                );
                break;

            case "EBRADA":
                router.push(
                    `/(transactions)/party/forms/EBRADA/${id}?mode=${mode}` as any
                );
                break;

            case "EBRAA":
                router.push(
                    `/(transactions)/party/forms/EBRAA/${id}?mode=${mode}` as any
                );
                break;

            case "EBRATDA":
                router.push(
                    `/(transactions)/party/forms/EBRATDA/${id}?mode=${mode}` as any
                );
                break;

            case "RPC":
                router.push(
                    `/(transactions)/party/forms/RPC/${id}?mode=${mode}` as any
                );
                break;

            case "SCSAAFA":
                router.push(
                    `/(transactions)/party/forms/SCSAAFA/${id}?mode=${mode}` as any
                );
                break;

            case "IDMMGOL":
                router.push(
                    `/(transactions)/party/forms/IDMMGOL/${id}?mode=${mode}` as any
                );
                break;

            case "ESRAA":
                router.push(
                    `/(transactions)/party/forms/ESRAA/${id}?mode=${mode}` as any
                );
                break;

            default:
                Alert.alert(
                    "Unavailable",
                    "This document cannot be opened."
                );
                break;
        }

    };


    // ============================================================
    // SEND FOR SIGNATURE
    // ============================================================

    const handleSendForSign =
        async (
            doc: DocItem
        ) => {

            if (!id) {
                return;
            }

            let endpoint =
                "";

            switch (
                doc.key
            ) {

                case "crg":
                    endpoint =
                        "/crgpdf/send-crg-for-signature";
                    break;

                case "EBRAA":
                    endpoint =
                        "/ebraapdf/send-buyer-amendment-for-signature";
                    break;

                case "EBRADA":
                    endpoint =
                        "/ebradapdf/send-buyer-representation-for-signature";
                    break;

                case "EBRATDA":
                    endpoint =
                        "/ebratdapdf/send-buyer-termination-for-signature";
                    break;

                case "RPC":
                    endpoint =
                        "/rpcpdf/send-rpc-for-signature";
                    break;

                case "SCSAAFA":
                    endpoint =
                        "/scsaafa/send-scsaafa-for-signature";
                    break;

                case "ESRAA":
                    endpoint =
                        "/esraa/send-esraa-for-signature";
                    break;

                case "IDMMGOL":
                    endpoint =
                        "/idmmgol/send-idmmgol-for-signature";
                    break;

                default:
                    Alert.alert(
                        "Unavailable",
                        "This document cannot be sent for signature."
                    );
                    return;
            }

            try {

                setSendingDoc(
                    doc.name
                );

                const response =
                    await fetch(
                        `${API_BASE}${endpoint}`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    partyId:
                                        id,
                                }),
                        }
                    );

                let data: any;

                try {
                    data =
                        await response.json();
                } catch {
                    throw new Error(
                        "Invalid server response."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        "Failed to send document."
                    );
                }

                Alert.alert(
                    "Success",
                    data?.message ||
                    "Email sent successfully."
                );

                await fetchData();

            } catch (
                error: any
            ) {

                console.error(
                    "Send For Sign Error:",
                    error
                );

                Alert.alert(
                    "Error",
                    error?.message ||
                    "Something went wrong."
                );

            } finally {

                setSendingDoc(
                    null
                );

            }

        };


    // ============================================================
    // LOADING
    // ============================================================

    if (
        authLoading ||
        !id
    ) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">

                <ActivityIndicator
                    size="large"
                    color="#9a6a3a"
                />

                <Text className="mt-4 text-sm text-gray-500">
                    Loading party documents...
                </Text>

            </View>
        );
    }


    // ============================================================
    // DOCUMENT SECTION
    // ============================================================

    const renderDocumentSection =
        (
            title: string,
            data: DocItem[],
            description: string
        ) => {

            return (
                <View className="mb-8">

                    <View className="mb-4 flex-row items-center justify-between">

                        <View className="flex-1">

                            <Text className="text-xl font-bold text-gray-800">
                                {title}
                            </Text>

                            <Text className="mt-1 text-sm text-gray-500">
                                {description}
                            </Text>

                        </View>

                        <View className="ml-3 rounded-xl bg-[#9a6a3a]/10 px-3 py-2">

                            <Text className="text-xs font-semibold text-[#9a6a3a]">
                                {data.length} Docs
                            </Text>

                        </View>

                    </View>

                    <View className="gap-4">

                        {data.map(
                            (
                                doc,
                                index
                            ) => (

                                <DocumentRow
                                    key={
                                        doc.key ||
                                        index
                                    }
                                    doc={
                                        doc
                                    }
                                    partyId={
                                        id
                                    }
                                    onOpen={() =>
                                        handleOpen(
                                            doc,
                                            "admin"
                                        )
                                    }
                                    onSendForSign={() =>
                                        handleSendForSign(
                                            doc
                                        )
                                    }
                                    onSignaturePress={() =>
                                        setSignatureDoc(
                                            doc
                                        )
                                    }
                                    sending={
                                        sendingDoc ===
                                        doc.name
                                    }
                                />

                            )
                        )}

                    </View>

                </View>
            );
        };


    // ============================================================
    // UPLOADED DOCS
    // ============================================================

    const hasDocs =
        !!(
            docs.licenseImage ||
            docs.passportImage
        );


    // ============================================================
    // AML SUMMARY
    // ============================================================

    const amlScreening =
        clientFintrac
            ?.amlScreening ||
        clientFintrac
            ?.aml ||
        null;

    const diliSenseReport =
        clientFintrac
            ?.dilisenseReport ||
        null;

    const amlTriggeredBy =
        getFintracAmlTriggers(
            clientFintrac
        );

    const amlRequired =
        amlTriggeredBy.length > 0;

    const effectiveAmlStatus =
        normalizeAmlStatus(
            amlScreening,
            diliSenseReport,
            amlRequired
        );

    const amlCompleted =
        isAmlCompleted(
            amlScreening,
            diliSenseReport
        );

    const amlHitCount =
        getAmlHitCount(
            amlScreening,
            diliSenseReport
        );

    const amlMatchFound =
        amlScreening?.matched === true ||
        amlScreening?.matchFound === true ||
        diliSenseReport?.matched === true ||
        diliSenseReport?.matchFound === true ||
        amlHitCount > 0;

    const amlReportAvailable =
        amlScreening?.reportAvailable === true ||
        diliSenseReport?.reportAvailable === true ||
        diliSenseReport?.generated === true;

    const canManuallyGenerateAml =
        Boolean(
            clientFintrac
        ) &&
        !amlRequired &&
        !amlReportAvailable &&
        effectiveAmlStatus !==
            "pending" &&
        effectiveAmlStatus !==
            "processing" &&
        !generatingAmlReport;


    // ============================================================
    // MAIN UI
    // ============================================================

    return (
        <>
            <Stack.Screen
                options={{
                    title:
                        "Party Documents",
                }}
            />

            <ScrollView
                className="flex-1 bg-gray-50"
                showsVerticalScrollIndicator={
                    false
                }
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 16,
                    paddingBottom: 40,
                }}
            >

                {/* ==================================================
                    HEADER
                ================================================== */}

                <View className="rounded-3xl border border-gray-200 bg-white p-5">

                    <View className="flex-row items-center">

                        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#9a6a3a]/10">

                            <FileText
                                size={27}
                                color="#9a6a3a"
                            />

                        </View>

                        <View className="ml-3 flex-1">

                            <Text className="text-xl font-bold text-gray-800">
                                Party Documents
                            </Text>

                            <Text className="mt-1 text-sm text-gray-500">
                                View, manage, and track all transaction documents.
                            </Text>

                        </View>

                    </View>


                    {/* STATS */}

                    <View className="mt-5 flex-row gap-2">

                        <View className="flex-1 rounded-2xl bg-gray-100 px-2 py-3">

                            <Text className="text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                General
                            </Text>

                            <Text className="mt-1 text-center text-lg font-bold text-gray-800">
                                {
                                    general.length
                                }
                            </Text>

                        </View>

                        <View className="flex-1 rounded-2xl bg-blue-50 px-2 py-3">

                            <Text className="text-center text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                                Buying
                            </Text>

                            <Text className="mt-1 text-center text-lg font-bold text-blue-700">
                                {
                                    buying.length
                                }
                            </Text>

                        </View>

                        <View className="flex-1 rounded-2xl bg-green-50 px-2 py-3">

                            <Text className="text-center text-[11px] font-semibold uppercase tracking-wide text-green-600">
                                Selling
                            </Text>

                            <Text className="mt-1 text-center text-lg font-bold text-green-700">
                                {
                                    selling.length
                                }
                            </Text>

                        </View>

                    </View>


                    {/* UPLOADED DOCS */}

                    <Pressable
                        disabled={
                            !hasDocs
                        }
                        onPress={() =>
                            setShowUploadedDocs(
                                true
                            )
                        }
                        className={`mt-5 h-12 items-center justify-center rounded-2xl ${
                            hasDocs
                                ? "bg-[#1f3a56]"
                                : "bg-gray-300"
                        }`}
                    >

                        <Text
                            className={`text-sm font-semibold ${
                                hasDocs
                                    ? "text-white"
                                    : "text-gray-500"
                            }`}
                        >
                            View Uploaded Docs
                        </Text>

                    </Pressable>

                </View>


                {/* ==================================================
                    CLIENT FINTRAC
                ================================================== */}

                {clientFintrac && (
                    <View className="mt-6">

                        <View className="rounded-3xl border border-gray-200 bg-white p-5">

                            <View className="flex-row items-start justify-between">

                                <View className="flex-1">

                                    <Text className="text-xl font-semibold text-gray-800">
                                        Client FINTRAC Declaration
                                    </Text>

                                    <Text className="mt-1 text-sm text-gray-500">
                                        Client AML-related declarations.
                                    </Text>

                                </View>

                                <View
                                    className={`ml-3 rounded-full px-3 py-1.5 ${
                                        amlMatchFound
                                            ? "bg-amber-100"
                                            : effectiveAmlStatus ===
                                              "failed"
                                            ? "bg-red-100"
                                            : effectiveAmlStatus ===
                                                  "pending" ||
                                              effectiveAmlStatus ===
                                                  "processing"
                                            ? "bg-blue-100"
                                            : amlCompleted
                                            ? "bg-green-100"
                                            : "bg-gray-100"
                                    }`}
                                >

                                    <Text
                                        className={`text-[10px] font-bold ${
                                            amlMatchFound
                                                ? "text-amber-700"
                                                : effectiveAmlStatus ===
                                                  "failed"
                                                ? "text-red-700"
                                                : effectiveAmlStatus ===
                                                      "pending" ||
                                                  effectiveAmlStatus ===
                                                      "processing"
                                                ? "text-blue-700"
                                                : amlCompleted
                                                ? "text-green-700"
                                                : "text-gray-600"
                                        }`}
                                    >
                                        AML:{" "}
                                        {getAmlStatusLabel(
                                            effectiveAmlStatus
                                        )}
                                    </Text>

                                </View>

                            </View>


                            {/* PEP */}

                            <View className="mt-5 border-b border-gray-100 pb-4">

                                <Text className="text-sm font-medium text-gray-700">
                                    Politically Exposed Individual
                                </Text>

                                <View
                                    className={`mt-2 self-start rounded-full px-3 py-1 ${
                                        clientFintrac.clientPoliticallyExposed ===
                                        "yes"
                                            ? "bg-red-100"
                                            : "bg-green-100"
                                    }`}
                                >

                                    <Text
                                        className={`text-sm font-semibold ${
                                            clientFintrac.clientPoliticallyExposed ===
                                            "yes"
                                                ? "text-red-700"
                                                : "text-green-700"
                                        }`}
                                    >
                                        {
                                            clientFintrac.clientPoliticallyExposed ||
                                            "-"
                                        }
                                    </Text>

                                </View>

                            </View>


                            {/* FAMILY */}

                            <View className="border-b border-gray-100 py-4">

                                <Text className="text-sm font-medium text-gray-700">
                                    Family Member in Government / Politics
                                </Text>

                                <View
                                    className={`mt-2 self-start rounded-full px-3 py-1 ${
                                        clientFintrac.clientFamilyGovernment ===
                                        "yes"
                                            ? "bg-red-100"
                                            : "bg-green-100"
                                    }`}
                                >

                                    <Text
                                        className={`text-sm font-semibold ${
                                            clientFintrac.clientFamilyGovernment ===
                                            "yes"
                                                ? "text-red-700"
                                                : "text-green-700"
                                        }`}
                                    >
                                        {
                                            clientFintrac.clientFamilyGovernment ||
                                            "-"
                                        }
                                    </Text>

                                </View>

                            </View>


                            {/* THIRD PARTY */}

                            <View className="pt-4">

                                <Text className="text-sm font-medium text-gray-700">
                                    Acting on Behalf of Third Party
                                </Text>

                                <View
                                    className={`mt-2 self-start rounded-full px-3 py-1 ${
                                        clientFintrac.clientThirdParty ===
                                        "yes"
                                            ? "bg-red-100"
                                            : "bg-green-100"
                                    }`}
                                >

                                    <Text
                                        className={`text-sm font-semibold ${
                                            clientFintrac.clientThirdParty ===
                                            "yes"
                                                ? "text-red-700"
                                                : "text-green-700"
                                        }`}
                                    >
                                        {
                                            clientFintrac.clientThirdParty ||
                                            "-"
                                        }
                                    </Text>

                                </View>

                            </View>

                        </View>


                        {/* ==================================================
                            AML SCREENING
                        ================================================== */}

                        <View className="mt-5 rounded-3xl border border-gray-200 bg-white p-5">

                            <View className="flex-row items-start justify-between">

                                <View className="flex-row flex-1 items-start">

                                    <View
                                        className={`h-11 w-11 items-center justify-center rounded-2xl ${
                                            amlMatchFound
                                                ? "bg-amber-100"
                                                : effectiveAmlStatus ===
                                                  "failed"
                                                ? "bg-red-100"
                                                : effectiveAmlStatus ===
                                                      "pending" ||
                                                  effectiveAmlStatus ===
                                                      "processing"
                                                ? "bg-blue-100"
                                                : amlCompleted
                                                ? "bg-green-100"
                                                : "bg-gray-100"
                                        }`}
                                    >

                                        {amlMatchFound ? (
                                            <AlertTriangle
                                                size={21}
                                                color="#d97706"
                                            />
                                        ) : effectiveAmlStatus ===
                                          "failed" ? (
                                            <ShieldAlert
                                                size={21}
                                                color="#dc2626"
                                            />
                                        ) : effectiveAmlStatus ===
                                              "pending" ||
                                          effectiveAmlStatus ===
                                              "processing" ? (
                                            <RefreshCw
                                                size={21}
                                                color="#2563eb"
                                            />
                                        ) : (
                                            <Shield
                                                size={21}
                                                color="#16a34a"
                                            />
                                        )}

                                    </View>

                                    <View className="ml-3 flex-1">

                                        <Text className="text-lg font-bold text-gray-800">
                                            AML Screening
                                        </Text>

                                        <Text className="mt-1 text-sm text-gray-500">
                                            {getAmlStatusLabel(
                                                effectiveAmlStatus
                                            )}
                                        </Text>

                                    </View>

                                </View>

                            </View>


                            {/* ==================================================
                                AML STATUS
                            ================================================== */}

                            <View
                                className={`mt-5 rounded-2xl border p-4 ${
                                    amlMatchFound
                                        ? "border-amber-200 bg-amber-50"
                                        : effectiveAmlStatus ===
                                          "failed"
                                        ? "border-red-200 bg-red-50"
                                        : effectiveAmlStatus ===
                                              "pending" ||
                                          effectiveAmlStatus ===
                                              "processing"
                                        ? "border-blue-200 bg-blue-50"
                                        : amlCompleted
                                        ? "border-green-200 bg-green-50"
                                        : "border-gray-200 bg-gray-50"
                                }`}
                            >

                                <View className="flex-row items-center">

                                    {amlMatchFound ? (
                                        <AlertTriangle
                                            size={22}
                                            color="#d97706"
                                        />
                                    ) : amlCompleted ? (
                                        <CheckCircle2
                                            size={22}
                                            color="#16a34a"
                                        />
                                    ) : (
                                        <Shield
                                            size={22}
                                            color="#6b7280"
                                        />
                                    )}

                                    <View className="ml-3 flex-1">

                                        <Text className="font-bold text-gray-800">
                                            AML Status
                                        </Text>

                                        <Text className="mt-1 text-sm text-gray-600">
                                            {getAmlStatusLabel(
                                                effectiveAmlStatus
                                            )}
                                        </Text>

                                    </View>

                                    {amlCompleted && (
                                        <View className="rounded-full bg-white px-3 py-1.5">

                                            <Text className="text-xs font-bold text-gray-700">
                                                {
                                                    amlHitCount
                                                }{" "}
                                                Match
                                                {amlHitCount ===
                                                1
                                                    ? ""
                                                    : "es"}
                                            </Text>

                                        </View>
                                    )}

                                </View>

                            </View>


                            {/* ==================================================
                                SEARCH DETAILS
                            ================================================== */}

                            {amlRequired ||
                                amlCompleted ||
                                diliSenseReport ? (
                                <View className="mt-5">

                                    <Text className="mb-3 text-sm font-bold text-gray-800">
                                        Screening Information
                                    </Text>

                                    <View className="rounded-2xl bg-gray-50 p-4">

                                        <View className="border-b border-gray-200 py-3">

                                            <Text className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                                Searched Name
                                            </Text>

                                            <Text className="mt-1 text-sm font-semibold text-gray-800">
                                                {cleanSearchedName(
                                                    amlScreening?.searchedName ||
                                                    diliSenseReport?.searchedName
                                                ) ||
                                                    "-"}
                                            </Text>

                                        </View>

                                        <View className="border-b border-gray-200 py-3">

                                            <Text className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                                Searched DOB
                                            </Text>

                                            <Text className="mt-1 text-sm font-semibold text-gray-800">
                                                {amlScreening?.searchedDob ||
                                                    diliSenseReport?.searchedDob ||
                                                    "-"}
                                            </Text>

                                        </View>

                                        <View className="py-3">

                                            <Text className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                                Provider
                                            </Text>

                                            <Text className="mt-1 text-sm font-semibold text-gray-800">
                                                {amlScreening?.provider ||
                                                    diliSenseReport?.provider ||
                                                    "DiliSense"}
                                            </Text>

                                        </View>

                                    </View>

                                </View>
                            ) : null}


                            {/* ==================================================
                                TRIGGERED BY
                            ================================================== */}

                            {amlTriggeredBy.length >
                                0 && (
                                <View className="mt-5">

                                    <Text className="mb-3 text-sm font-bold text-gray-800">
                                        Screening Triggered By
                                    </Text>

                                    <View className="gap-2">

                                        {amlTriggeredBy.map(
                                            trigger => (
                                                <View
                                                    key={
                                                        trigger
                                                    }
                                                    className="flex-row items-center rounded-xl border border-red-100 bg-red-50 px-3 py-3"
                                                >

                                                    <AlertTriangle
                                                        size={
                                                            16
                                                        }
                                                        color="#dc2626"
                                                    />

                                                    <Text className="ml-2 flex-1 text-xs font-bold text-red-700">
                                                        {trigger ===
                                                        "politicallyExposed"
                                                            ? "Politically Exposed Individual"
                                                            : trigger ===
                                                              "familyPoliticallyExposed"
                                                            ? "Family Member in Government / Politics"
                                                            : trigger ===
                                                              "thirdPartyConducted"
                                                            ? "Acting on Behalf of a Third Party"
                                                            : trigger}
                                                    </Text>

                                                </View>
                                            )
                                        )}

                                    </View>

                                </View>
                            )}


                            {/* ==================================================
                                RESULT
                            ================================================== */}

                            {amlCompleted && (
                                <View
                                    className={`mt-5 rounded-2xl border p-4 ${
                                        amlMatchFound
                                            ? "border-amber-200 bg-amber-50"
                                            : "border-green-200 bg-green-50"
                                    }`}
                                >

                                    <View className="flex-row items-center">

                                        {amlMatchFound ? (
                                            <AlertTriangle
                                                size={
                                                    21
                                                }
                                                color="#d97706"
                                            />
                                        ) : (
                                            <CheckCircle2
                                                size={
                                                    21
                                                }
                                                color="#16a34a"
                                            />
                                        )}

                                        <View className="ml-3 flex-1">

                                            <Text
                                                className={`font-bold ${
                                                    amlMatchFound
                                                        ? "text-amber-800"
                                                        : "text-green-800"
                                                }`}
                                            >
                                                {amlMatchFound
                                                    ? "Potential AML Match Found"
                                                    : "No Match Indicated"}
                                            </Text>

                                            <Text className="mt-1 text-xs text-gray-600">
                                                Screening records returned:{" "}
                                                <Text className="font-bold">
                                                    {
                                                        amlHitCount
                                                    }
                                                </Text>
                                            </Text>

                                        </View>

                                    </View>

                                    {(
                                        amlScreening?.result ||
                                        diliSenseReport?.result
                                    ) && (
                                        <Text className="mt-3 border-t border-black/10 pt-3 text-sm text-gray-700">
                                            {
                                                amlScreening?.result ||
                                                diliSenseReport?.result
                                            }
                                        </Text>
                                    )}

                                </View>
                            )}


                            {/* ==================================================
                                AML MATCHES
                            ================================================== */}

                            {(
                                amlScreening?.hits ||
                                diliSenseReport?.hits ||
                                []
                            ).length > 0 && (
                                <View className="mt-5">

                                    <Text className="mb-3 text-sm font-bold text-gray-800">
                                        Screening Matches
                                    </Text>

                                    <View className="gap-3">

                                        {(
                                            amlScreening?.hits ||
                                            diliSenseReport?.hits ||
                                            []
                                        ).map(
                                            (
                                                hit,
                                                index
                                            ) => (

                                                <View
                                                    key={
                                                        index
                                                    }
                                                    className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                                                >

                                                    <Text className="font-bold text-gray-800">
                                                        {
                                                            hit.name ||
                                                            "Potential Match"
                                                        }
                                                    </Text>

                                                    {hit.category && (
                                                        <Text className="mt-1 text-xs text-gray-600">
                                                            Category:{" "}
                                                            {
                                                                hit.category
                                                            }
                                                        </Text>
                                                    )}

                                                    {hit.source && (
                                                        <Text className="mt-1 text-xs text-gray-600">
                                                            Source:{" "}
                                                            {
                                                                hit.source
                                                            }
                                                        </Text>
                                                    )}

                                                    {hit.matchType && (
                                                        <Text className="mt-1 text-xs text-gray-600">
                                                            Match Type:{" "}
                                                            {
                                                                hit.matchType
                                                            }
                                                        </Text>
                                                    )}

                                                    {hit.details && (
                                                        <Text className="mt-2 text-sm text-gray-700">
                                                            {
                                                                hit.details
                                                            }
                                                        </Text>
                                                    )}

                                                    {typeof hit.score ===
                                                        "number" && (
                                                        <View className="mt-2 self-start rounded-full bg-white px-3 py-1.5">

                                                            <Text className="text-xs font-bold text-gray-700">
                                                                Score:{" "}
                                                                {
                                                                    hit.score
                                                                }
                                                            </Text>

                                                        </View>
                                                    )}

                                                </View>

                                            )
                                        )}

                                    </View>

                                </View>
                            )}


                            {/* ==================================================
                                REPORT ACTIONS
                            ================================================== */}

                            {amlReportAvailable && (
                                <View className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">

                                    <View className="flex-row items-start">

                                        <FileText
                                            size={22}
                                            color="#16a34a"
                                        />

                                        <View className="ml-3 flex-1">

                                            <Text className="font-bold text-green-800">
                                                AML Report Available
                                            </Text>

                                            <Text className="mt-1 text-xs leading-5 text-green-700">
                                                The DiliSense screening report is available for administrative review.
                                            </Text>

                                        </View>

                                    </View>


                                    <View className="mt-4 gap-3">

                                        <Pressable
                                            onPress={() =>
                                                setShowAmlReport(
                                                    true
                                                )
                                            }
                                            className="h-12 flex-row items-center justify-center rounded-xl bg-[#1f3a56]"
                                        >

                                            <ExternalLink
                                                size={
                                                    17
                                                }
                                                color="#ffffff"
                                            />

                                            <Text className="ml-2 text-sm font-bold text-white">
                                                View AML Report
                                            </Text>

                                        </Pressable>


                                        <Pressable
                                            onPress={
                                                openAmlPdf
                                            }
                                            className="h-12 flex-row items-center justify-center rounded-xl bg-green-600"
                                        >

                                            <Download
                                                size={
                                                    17
                                                }
                                                color="#ffffff"
                                            />

                                            <Text className="ml-2 text-sm font-bold text-white">
                                                Open / Download PDF
                                            </Text>

                                        </Pressable>


                                        <Pressable
                                            disabled={
                                                generatingAmlReport
                                            }
                                            onPress={() =>
                                                handleGenerateAmlReport(
                                                    true
                                                )
                                            }
                                            className={`h-12 flex-row items-center justify-center rounded-xl ${
                                                generatingAmlReport
                                                    ? "bg-gray-400"
                                                    : "bg-[#B8860B]"
                                            }`}
                                        >

                                            {generatingAmlReport ? (
                                                <ActivityIndicator
                                                    size="small"
                                                    color="#ffffff"
                                                />
                                            ) : (
                                                <RefreshCw
                                                    size={
                                                        17
                                                    }
                                                    color="#ffffff"
                                                />
                                            )}

                                            <Text className="ml-2 text-sm font-bold text-white">
                                                {generatingAmlReport
                                                    ? "Regenerating..."
                                                    : "Regenerate Report"}
                                            </Text>

                                        </Pressable>

                                    </View>

                                </View>
                            )}


                            {/* ==================================================
                                MANUAL GENERATION
                            ================================================== */}

                            {canManuallyGenerateAml && (
                                <View className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">

                                    <View className="flex-row items-start">

                                        <Search
                                            size={22}
                                            color="#2563eb"
                                        />

                                        <View className="ml-3 flex-1">

                                            <Text className="font-bold text-blue-800">
                                                Manual AML Screening
                                            </Text>

                                            <Text className="mt-1 text-xs leading-5 text-blue-700">
                                                FINTRAC answers do not currently trigger AML screening, but an administrator can manually request DiliSense screening.
                                            </Text>

                                        </View>

                                    </View>

                                    <Pressable
                                        disabled={
                                            generatingAmlReport
                                        }
                                        onPress={() =>
                                            handleGenerateAmlReport(
                                                false
                                            )
                                        }
                                        className={`mt-4 h-12 flex-row items-center justify-center rounded-xl ${
                                            generatingAmlReport
                                                ? "bg-gray-400"
                                                : "bg-[#1f3a56]"
                                        }`}
                                    >

                                        {generatingAmlReport ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="#ffffff"
                                            />
                                        ) : (
                                            <Search
                                                size={
                                                    17
                                                }
                                                color="#ffffff"
                                            />
                                        )}

                                        <Text className="ml-2 text-sm font-bold text-white">
                                            {generatingAmlReport
                                                ? "Starting AML..."
                                                : "Generate AML Report"}
                                        </Text>

                                    </Pressable>

                                </View>
                            )}

                        </View>

                    </View>
                )}


                {/* ==================================================
                    DOCUMENT SECTIONS
                ================================================== */}

                <View className="mt-8">

                    {renderDocumentSection(
                        "PDF Templates",
                        general,
                        "General transaction documents"
                    )}

                    {renderDocumentSection(
                        "Buying Documents",
                        buying,
                        "Buyer-related transaction documents"
                    )}

                    {renderDocumentSection(
                        "Selling Documents",
                        selling,
                        "Seller-related transaction documents"
                    )}

                </View>

            </ScrollView>


            {/* ============================================================
                AML WEBSITE REPORT
            ============================================================ */}

            {id && (
                <AmlReportWebsite
                    visible={
                        showAmlReport
                    }
                    onClose={() =>
                        setShowAmlReport(
                            false
                        )
                    }
                    partyId={
                        id
                    }
                    screening={
                        amlScreening
                    }
                    report={
                        diliSenseReport
                    }
                />
            )}


            {/* ============================================================
                UPLOADED DOCUMENTS MODAL
            ============================================================ */}

            <Modal
                visible={
                    showUploadedDocs
                }
                animationType="slide"
                transparent
                onRequestClose={() =>
                    setShowUploadedDocs(
                        false
                    )
                }
            >

                <View className="flex-1 justify-end bg-black/50">

                    <View className="max-h-[92%] rounded-t-3xl bg-white">

                        <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-5">

                            <View className="flex-1">

                                <Text className="text-xl font-bold text-gray-800">
                                    Uploaded Documents
                                </Text>

                                <Text className="mt-1 text-sm text-gray-500">
                                    Preview uploaded identification documents.
                                </Text>

                            </View>

                            <Pressable
                                onPress={() =>
                                    setShowUploadedDocs(
                                        false
                                    )
                                }
                                className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100"
                            >
                                <X
                                    size={
                                        20
                                    }
                                    color="#374151"
                                />
                            </Pressable>

                        </View>


                        <ScrollView
                            showsVerticalScrollIndicator={
                                false
                            }
                            contentContainerStyle={{
                                padding: 20,
                                paddingBottom: 40,
                            }}
                        >

                            {/* LICENSE */}

                            <View className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">

                                <Text className="mb-3 text-base font-semibold text-gray-800">
                                    Driving License
                                </Text>

                                {docs.licenseImage ? (

                                    <Pressable
                                        onPress={() =>
                                            setPreviewImage(
                                                docs.licenseImage!
                                            )
                                        }
                                    >

                                        <Image
                                            source={{
                                                uri: docs.licenseImage,
                                            }}
                                            className="h-56 w-full rounded-2xl"
                                            resizeMode="cover"
                                        />

                                        <View className="mt-2 flex-row items-center justify-center">

                                            <Text className="text-xs font-semibold text-[#9a6a3a]">
                                                Tap to Preview
                                            </Text>

                                        </View>

                                    </Pressable>

                                ) : (

                                    <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8">

                                        <FileText
                                            size={
                                                30
                                            }
                                            color="#9ca3af"
                                        />

                                        <Text className="mt-3 text-center text-sm text-gray-400">
                                            Driving license not uploaded yet.
                                        </Text>

                                    </View>

                                )}

                            </View>


                            {/* PASSPORT */}

                            <View className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

                                <Text className="mb-3 text-base font-semibold text-gray-800">
                                    Passport
                                </Text>

                                {docs.passportImage ? (

                                    <Pressable
                                        onPress={() =>
                                            setPreviewImage(
                                                docs.passportImage!
                                            )
                                        }
                                    >

                                        <Image
                                            source={{
                                                uri: docs.passportImage,
                                            }}
                                            className="h-56 w-full rounded-2xl"
                                            resizeMode="cover"
                                        />

                                        <View className="mt-2 flex-row items-center justify-center">

                                            <Text className="text-xs font-semibold text-[#9a6a3a]">
                                                Tap to Preview
                                            </Text>

                                        </View>

                                    </Pressable>

                                ) : (

                                    <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8">

                                        <FileText
                                            size={
                                                30
                                            }
                                            color="#9ca3af"
                                        />

                                        <Text className="mt-3 text-center text-sm text-gray-400">
                                            Passport not uploaded yet.
                                        </Text>

                                    </View>

                                )}

                            </View>

                        </ScrollView>

                    </View>

                </View>

            </Modal>


            {/* ============================================================
                IMAGE PREVIEW MODAL
            ============================================================ */}

            <Modal
                visible={
                    !!previewImage
                }
                animationType="fade"
                transparent
                onRequestClose={() =>
                    setPreviewImage(
                        null
                    )
                }
            >

                <View className="flex-1 items-center justify-center bg-black/90 px-4">

                    <Pressable
                        onPress={() =>
                            setPreviewImage(
                                null
                            )
                        }
                        className="absolute right-5 top-14 z-20 h-11 w-11 items-center justify-center rounded-full bg-white/20"
                    >

                        <X
                            size={
                                22
                            }
                            color="#ffffff"
                        />

                    </Pressable>

                    {previewImage && (
                        <Image
                            source={{
                                uri: previewImage,
                            }}
                            className="h-[75%] w-full"
                            resizeMode="contain"
                        />
                    )}

                </View>

            </Modal>


            {/* ============================================================
                SIGNATURE PROGRESS MODAL
            ============================================================ */}

            <Modal
                visible={
                    !!signatureDoc
                }
                animationType="slide"
                transparent
                onRequestClose={() =>
                    setSignatureDoc(
                        null
                    )
                }
            >

                <View className="flex-1 justify-end bg-black/50">

                    {signatureDoc &&
                        id && (
                            <SignatureStatus
                                doc={
                                    signatureDoc
                                }
                                partyId={
                                    id
                                }
                                onClose={() =>
                                    setSignatureDoc(
                                        null
                                    )
                                }
                            />
                        )}

                </View>

            </Modal>

        </>
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
//     Image,
//     Modal,
//     Pressable,
//     ScrollView,
//     Text,
//     View,
// } from "react-native";

// import { Stack, useLocalSearchParams, useRouter } from "expo-router";

// import {
//     ArrowLeft,
//     CheckCircle2,
//     ChevronDown,
//     Clock3,
//     ExternalLink,
//     FileText,
//     X,
// } from "lucide-react-native";

// import { useAuth } from "../../../contexts/AuthContext";


// // ============================================================
// // TYPES
// // ============================================================

// interface SignerStatus {
//     role: string;
//     signed: boolean;

//     email?: string;
//     name?: string;

//     recipientId?: string;
//     routingOrder?: string;
//     clientUserId?: string;
// }

// interface DocItem {
//     name: string;
//     key?: string;
//     status?: "Filled" | "Not Filled";

//     envelopeId?: string;

//     signingStatus?: {
//         completed: number;
//         total: number;
//         allSigned: boolean;
//         signers: SignerStatus[];
//     };
// }

// interface ClientFintrac {
//     clientPoliticallyExposed?: string;
//     clientFamilyGovernment?: string;
//     clientThirdParty?: string;
// }

// interface UploadedDocs {
//     licenseImage?: string;
//     passportImage?: string;
// }


// // ============================================================
// // DATA
// // ============================================================

// const generalDocs: DocItem[] = [
//     {
//         name: "FINTRAC - Individual Identification Information Record Form",
//         key: "fintrac",
//     },
//     {
//         name: "FINTRAC - Politically Exposed Person Checklist Form",
//         key: "pep",
//     },
//     {
//         name: "Consumer Relationships Guide (Print Friendly)",
//         key: "crg",
//     },
// ];

// const buyingDocsDefault: DocItem[] = [
//     {
//         name: "Exclusive Buyer Representation Agreement (Designated Agency)",
//         key: "EBRADA",
//     },
//     {
//         name: "Exclusive Buyer Representation Agreement Amendment",
//         key: "EBRAA",
//     },
//     {
//         name: "Exclusive Buyer Representation Agreement Termination (Designated Agency)",
//         key: "EBRATDA",
//     },
//     {
//         name: "Residential Purchase Contract",
//         key: "RPC",
//     },
// ];

// const sellingDocsDefault: DocItem[] = [
//     {
//         name: "Seller Customer Status Acknowledgment and Fee Agreement",
//         key: "SCSAAFA",
//     },
//     {
//         name: "CREB® - Illegal Drug Manufacture_Marijuana Grow Operation Listing",
//         key: "IDMMGOL",
//     },
//     {
//         name: "Exclusive Seller Representation Agreement Amendment",
//         key: "ESRAA",
//     },
// ];

// const API_BASE = "https://realtorparth.ca/api";


// // ============================================================
// // STATUS BADGE
// // ============================================================

// function StatusBadge({
//     status,
// }: {
//     status: string;
// }) {
//     const isFilled =
//         status === "Filled";

//     return (
//         <View
//             className={`flex-row items-center rounded-full border px-3 py-1.5 ${
//                 isFilled
//                     ? "border-yellow-200 bg-green-50"
//                     : "border-red-200 bg-yellow-50"
//             }`}
//         >
//             <View
//                 className={`mr-2 h-2 w-2 rounded-full ${
//                     isFilled
//                         ? "bg-yellow-500"
//                         : "bg-red-500"
//                 }`}
//             />

//             <Text
//                 className={`text-xs font-semibold ${
//                     isFilled
//                         ? "text-yellow-700"
//                         : "text-red-700"
//                 }`}
//             >
//                 {status}
//             </Text>
//         </View>
//     );
// }


// // ============================================================
// // SIGNATURE PROGRESS MODAL
// // ============================================================

// function SignatureStatus({
//     doc,
//     partyId,
//     onClose,
// }: {
//     doc: DocItem;
//     partyId: string;
//     onClose: () => void;
// }) {
//     const signingStatus =
//         doc.signingStatus;

//     const [
//         sendingRecipientId,
//         setSendingRecipientId,
//     ] = useState<string | null>(null);


//     if (!signingStatus) {
//         return null;
//     }


//     const resendReminder = async (
//         signer: SignerStatus
//     ) => {
//         try {
//             if (!partyId) {
//                 Alert.alert(
//                     "Error",
//                     "Party ID not found."
//                 );
//                 return;
//             }

//             if (!signer.recipientId) {
//                 Alert.alert(
//                     "Error",
//                     "Recipient ID not found."
//                 );
//                 return;
//             }

//             setSendingRecipientId(
//                 signer.recipientId
//             );

//             const response =
//                 await fetch(
//                     `${API_BASE}/docusign/remind-signer`,
//                     {
//                         method: "POST",
//                         headers: {
//                             "Content-Type":
//                                 "application/json",
//                         },
//                         body: JSON.stringify({
//                             partyId,
//                             documentType:
//                                 doc.key,
//                             recipientId:
//                                 signer.recipientId,
//                         }),
//                     }
//                 );

//             let data: any;

//             try {
//                 data =
//                     await response.json();
//             } catch {
//                 throw new Error(
//                     "Invalid server response."
//                 );
//             }

//             if (!response.ok) {
//                 throw new Error(
//                     data?.message ||
//                     "Failed to send reminder."
//                 );
//             }

//             Alert.alert(
//                 "Reminder Sent",
//                 data?.message ||
//                 "Reminder email sent successfully."
//             );
//         } catch (error: any) {
//             console.error(
//                 "Reminder Error:",
//                 error
//             );

//             Alert.alert(
//                 "Error",
//                 error?.message ||
//                 "Unable to send reminder."
//             );
//         } finally {
//             setSendingRecipientId(
//                 null
//             );
//         }
//     };


//     const percentage =
//         Math.round(
//             (signingStatus.completed /
//                 Math.max(
//                     signingStatus.total,
//                     1
//                 )) *
//                 100
//         );


//     return (
//         <View className="rounded-t-3xl bg-white">

//             {/* HEADER */}

//             <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-5">

//                 <View className="flex-1">

//                     <Text className="text-xl font-bold text-gray-800">
//                         Signature Progress
//                     </Text>

//                     <Text className="mt-1 text-sm text-gray-500">
//                         Track document signatures
//                     </Text>

//                 </View>

//                 <Pressable
//                     onPress={onClose}
//                     className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100"
//                 >
//                     <X
//                         size={20}
//                         color="#374151"
//                     />
//                 </Pressable>

//             </View>


//             <ScrollView
//                 showsVerticalScrollIndicator={
//                     false
//                 }
//                 contentContainerStyle={{
//                     padding: 20,
//                     paddingBottom: 35,
//                 }}
//             >

//                 {/* SUMMARY */}

//                 <View className="mb-5 rounded-2xl bg-gray-50 p-4">

//                     <View className="flex-row items-center justify-between">

//                         <Text className="text-sm font-semibold text-gray-700">
//                             Signatures
//                         </Text>

//                         <Text className="text-lg font-bold text-[#9a6a3a]">
//                             {
//                                 signingStatus.completed
//                             }
//                             /
//                             {
//                                 signingStatus.total
//                             }
//                         </Text>

//                     </View>


//                     <View className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">

//                         <View
//                             className="h-full rounded-full bg-green-500"
//                             style={{
//                                 width: `${percentage}%`,
//                             }}
//                         />

//                     </View>


//                     <Text className="mt-2 text-xs text-gray-500">
//                         {percentage}% completed
//                     </Text>

//                 </View>


//                 {/* SIGNERS */}

//                 <View className="gap-3">

//                     {signingStatus.signers.map(
//                         (
//                             signer,
//                             index
//                         ) => {

//                             const isSending =
//                                 sendingRecipientId ===
//                                 signer.recipientId;

//                             return (
//                                 <View
//                                     key={
//                                         signer.recipientId ||
//                                         `${signer.role}-${index}`
//                                     }
//                                     className="rounded-2xl border border-gray-200 bg-white p-4"
//                                 >

//                                     <View className="flex-row items-start">

//                                         {signer.signed ? (
//                                             <CheckCircle2
//                                                 size={
//                                                     21
//                                                 }
//                                                 color="#22c55e"
//                                             />
//                                         ) : (
//                                             <Clock3
//                                                 size={
//                                                     21
//                                                 }
//                                                 color="#eab308"
//                                             />
//                                         )}


//                                         <View className="ml-3 flex-1">

//                                             <View className="flex-row items-start justify-between">

//                                                 <View className="flex-1 pr-2">

//                                                     <Text className="text-sm font-semibold text-gray-800">
//                                                         {
//                                                             signer.role
//                                                         }
//                                                     </Text>

//                                                     {signer.name && (
//                                                         <Text className="mt-1 text-xs text-gray-600">
//                                                             {
//                                                                 signer.name
//                                                             }
//                                                         </Text>
//                                                     )}

//                                                     {signer.email && (
//                                                         <Text className="mt-1 text-xs text-gray-500">
//                                                             {
//                                                                 signer.email
//                                                             }
//                                                         </Text>
//                                                     )}

//                                                 </View>


//                                                 <View
//                                                     className={`rounded-full px-2.5 py-1 ${
//                                                         signer.signed
//                                                             ? "bg-green-100"
//                                                             : "bg-yellow-100"
//                                                     }`}
//                                                 >
//                                                     <Text
//                                                         className={`text-xs font-semibold ${
//                                                             signer.signed
//                                                                 ? "text-green-700"
//                                                                 : "text-yellow-700"
//                                                         }`}
//                                                     >
//                                                         {signer.signed
//                                                             ? "Signed"
//                                                             : "Pending"}
//                                                     </Text>
//                                                 </View>

//                                             </View>


//                                             {/* REMINDER */}

//                                             {!signer.signed &&
//                                                 (signer.recipientId ? (
//                                                     <Pressable
//                                                         disabled={
//                                                             isSending
//                                                         }
//                                                         onPress={() =>
//                                                             resendReminder(
//                                                                 signer
//                                                             )
//                                                         }
//                                                         className="mt-3 h-10 items-center justify-center rounded-xl bg-blue-600"
//                                                     >
//                                                         {isSending ? (
//                                                             <ActivityIndicator
//                                                                 size="small"
//                                                                 color="#ffffff"
//                                                             />
//                                                         ) : (
//                                                             <Text className="text-xs font-semibold text-white">
//                                                                 Send Reminder
//                                                             </Text>
//                                                         )}
//                                                     </Pressable>
//                                                 ) : (
//                                                     <View className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
//                                                         <Text className="text-center text-xs font-medium text-amber-700">
//                                                             You haven't sent this document for signature yet.
//                                                         </Text>
//                                                     </View>
//                                                 ))}

//                                         </View>

//                                     </View>

//                                 </View>
//                             );
//                         }
//                     )}

//                 </View>

//             </ScrollView>

//         </View>
//     );
// }


// // ============================================================
// // DOCUMENT CARD
// // ============================================================

// function DocumentRow({
//     doc,
//     partyId,
//     onOpen,
//     onSendForSign,
//     onSignaturePress,
//     sending,
// }: {
//     doc: DocItem;
//     partyId: string;
//     onOpen: () => void;
//     onSendForSign: () => void;
//     onSignaturePress: () => void;
//     sending: boolean;
// }) {
//     const canSendForSign =
//         ![
//             "fintrac",
//             "pep",
//         ].includes(
//             doc.key ?? ""
//         );

//     const isFilled =
//         doc.status === "Filled";


//     return (
//         <View className="rounded-2xl border border-gray-200 bg-white p-4">

//             {/* DOCUMENT NAME */}

//             <View>

//                 <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
//                     Document Name
//                 </Text>

//                 <Text className="text-base font-semibold leading-6 text-gray-800">
//                     {doc.name}
//                 </Text>

//             </View>


//             {/* STATUS */}

//             <View className="mt-4 flex-row items-center justify-between">

//                 <StatusBadge
//                     status={
//                         doc.status ||
//                         "Not Filled"
//                     }
//                 />

//                 {doc.signingStatus && (
//                     <Pressable
//                         onPress={
//                             onSignaturePress
//                         }
//                         className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
//                     >

//                         <Text className="mr-2 text-xs font-semibold text-gray-700">
//                             {
//                                 doc
//                                     .signingStatus
//                                     .completed
//                             }
//                             /
//                             {
//                                 doc
//                                     .signingStatus
//                                     .total
//                             }{" "}
//                             Signed
//                         </Text>

//                         <ChevronDown
//                             size={15}
//                             color="#6b7280"
//                         />

//                     </Pressable>
//                 )}

//             </View>


//             {/* ACTIONS */}

//             <View className="mt-4 gap-3">

//                 <Pressable
//                     onPress={onOpen}
//                     className="h-12 flex-row items-center justify-center rounded-xl bg-[#9a6a3a]"
//                 >

//                     <ExternalLink
//                         size={17}
//                         color="#ffffff"
//                     />

//                     <Text className="ml-2 text-sm font-semibold text-white">
//                         Open
//                     </Text>

//                 </Pressable>


//                 {canSendForSign && (
//                     <Pressable
//                         disabled={
//                             !isFilled ||
//                             sending
//                         }
//                         onPress={
//                             onSendForSign
//                         }
//                         className={`h-12 flex-row items-center justify-center rounded-xl ${
//                             isFilled
//                                 ? "bg-blue-600"
//                                 : "bg-gray-300"
//                         }`}
//                     >

//                         {sending ? (
//                             <ActivityIndicator
//                                 size="small"
//                                 color="#ffffff"
//                             />
//                         ) : (
//                             <Text className="text-sm font-semibold text-white">
//                                 Send for Sign
//                             </Text>
//                         )}

//                     </Pressable>
//                 )}

//             </View>

//         </View>
//     );
// }


// // ============================================================
// // MAIN SCREEN
// // ============================================================

// export default function Partiespdfdata() {

//     const router =
//         useRouter();

//     const params =
//         useLocalSearchParams<{
//             id?: string;
//         }>();

//     const id =
//         typeof params.id ===
//         "string"
//             ? params.id
//             : Array.isArray(
//                 params.id
//             )
//                 ? params.id[0]
//                 : undefined;


//     const {
//         user,
//         loading: authLoading,
//     } = useAuth();


//     // ========================================================
//     // DOCUMENT STATE
//     // ========================================================

//     const [general, setGeneral] =
//         useState<DocItem[]>(
//             generalDocs
//         );

//     const [buying, setBuying] =
//         useState<DocItem[]>(
//             buyingDocsDefault
//         );

//     const [selling, setSelling] =
//         useState<DocItem[]>(
//             sellingDocsDefault
//         );


//     // ========================================================
//     // FINTRAC
//     // ========================================================

//     const [
//         clientFintrac,
//         setClientFintrac,
//     ] = useState<ClientFintrac | null>(
//         null
//     );


//     // ========================================================
//     // UPLOADED DOCUMENTS
//     // ========================================================

//     const [
//         docs,
//         setDocs,
//     ] = useState<UploadedDocs>(
//         {}
//     );


//     // ========================================================
//     // MODALS
//     // ========================================================

//     const [
//         showUploadedDocs,
//         setShowUploadedDocs,
//     ] = useState(false);

//     const [
//         previewImage,
//         setPreviewImage,
//     ] = useState<string | null>(
//         null
//     );

//     const [
//         signatureDoc,
//         setSignatureDoc,
//     ] = useState<DocItem | null>(
//         null
//     );


//     // ========================================================
//     // SENDING
//     // ========================================================

//     const [
//         sendingDoc,
//         setSendingDoc,
//     ] = useState<string | null>(
//         null
//     );


//     // ========================================================
//     // FETCH ALL DATA
//     // ========================================================

//     const fetchData =
//         useCallback(async () => {

//             if (!id) {
//                 return;
//             }

//             try {

//                 const [
//                     fintracRes,
//                     pepRes,
//                     crgRes,
//                     docsRes,
//                     clientFintracRes,
//                     partyRes,
//                 ] = await Promise.all([

//                     fetch(
//                         `${API_BASE}/fintracpdf/fintrac/user/${id}`
//                     ),

//                     fetch(
//                         `${API_BASE}/fintracpeppdf/pep/user/${id}`
//                     ),

//                     fetch(
//                         `${API_BASE}/crgpdf/crg/user/${id}`
//                     ),

//                     fetch(
//                         `${API_BASE}/statuspdf/document-status/${id}`
//                     ),

//                     fetch(
//                         `${API_BASE}/fintracpdf/client/${id}`
//                     ),

//                     fetch(
//                         `${API_BASE}/transactions/parties/party/${id}`
//                     ),

//                 ]);


//                 const [
//                     fintracData,
//                     pepData,
//                     crgData,
//                     docsData,
//                     clientFintracJson,
//                     partyData,
//                 ] = await Promise.all([

//                     fintracRes.json(),

//                     pepRes.json(),

//                     crgRes.json(),

//                     docsRes.json(),

//                     clientFintracRes.json(),

//                     partyRes.json(),

//                 ]);


//                 console.log(
//                     "Document Status:",
//                     docsData
//                 );


//                 // ==================================================
//                 // CLIENT FINTRAC
//                 // ==================================================

//                 if (
//                     clientFintracJson?.success
//                 ) {
//                     setClientFintrac(
//                         clientFintracJson.data
//                     );
//                 } else {
//                     setClientFintrac(
//                         null
//                     );
//                 }


//                 // ==================================================
//                 // GENERAL
//                 // ==================================================

//                 setGeneral(
//                     (previous) =>
//                         previous.map(
//                             (doc) => {

//                                 if (
//                                     doc.key ===
//                                     "fintrac"
//                                 ) {
//                                     return {
//                                         ...doc,
//                                         status:
//                                             fintracData?.data
//                                                 ? "Filled"
//                                                 : "Not Filled",
//                                     };
//                                 }


//                                 if (
//                                     doc.key ===
//                                     "pep"
//                                 ) {
//                                     return {
//                                         ...doc,
//                                         status:
//                                             pepData?.data
//                                                 ? "Filled"
//                                                 : "Not Filled",
//                                     };
//                                 }


//                                 if (
//                                     doc.key ===
//                                     "crg"
//                                 ) {
//                                     return {
//                                         ...doc,
//                                         status:
//                                             docsData
//                                                 ?.data
//                                                 ?.crg
//                                                 ?.filled
//                                                 ? "Filled"
//                                                 : "Not Filled",

//                                         signingStatus:
//                                             docsData
//                                                 ?.data
//                                                 ?.crg
//                                                 ?.signing ||
//                                             null,

//                                         envelopeId:
//                                             docsData
//                                                 ?.data
//                                                 ?.crg
//                                                 ?.envelopeId ||
//                                             null,
//                                     };
//                                 }


//                                 return doc;
//                             }
//                         )
//                 );


//                 // ==================================================
//                 // BUYING
//                 // ==================================================

//                 if (
//                     docsData?.data
//                 ) {

//                     setBuying(
//                         (previous) =>
//                             previous.map(
//                                 (doc) => ({
//                                     ...doc,

//                                     status:
//                                         docsData
//                                             .data[
//                                             doc.key!
//                                         ]
//                                             ?.filled
//                                             ? "Filled"
//                                             : "Not Filled",

//                                     signingStatus:
//                                         docsData
//                                             .data[
//                                             doc.key!
//                                         ]
//                                             ?.signing ||
//                                         null,

//                                     envelopeId:
//                                         docsData
//                                             .data[
//                                             doc.key!
//                                         ]
//                                             ?.envelopeId ||
//                                         null,
//                                 })
//                             )
//                     );


//                     // ==================================================
//                     // SELLING
//                     // ==================================================

//                     setSelling(
//                         (previous) =>
//                             previous.map(
//                                 (doc) => ({
//                                     ...doc,

//                                     status:
//                                         docsData
//                                             .data[
//                                             doc.key!
//                                         ]
//                                             ?.filled
//                                             ? "Filled"
//                                             : "Not Filled",

//                                     signingStatus:
//                                         docsData
//                                             .data[
//                                             doc.key!
//                                         ]
//                                             ?.signing ||
//                                         null,

//                                     envelopeId:
//                                         docsData
//                                             .data[
//                                             doc.key!
//                                         ]
//                                             ?.envelopeId ||
//                                         null,
//                                 })
//                             )
//                     );

//                 }


//                 // ==================================================
//                 // UPLOADED DOCUMENTS
//                 // ==================================================

//                 if (
//                     partyData?.party
//                 ) {

//                     setDocs({
//                         licenseImage:
//                             partyData
//                                 .party
//                                 .licenseImage,

//                         passportImage:
//                             partyData
//                                 .party
//                                 .passportImage,
//                     });

//                 } else {

//                     setDocs({});

//                 }

//             } catch (error) {

//                 console.error(
//                     "Failed to fetch party data:",
//                     error
//                 );

//             }

//         }, [id]);


//     // ========================================================
//     // AUTO REFRESH EVERY 3 SECONDS
//     // ========================================================

//     useEffect(() => {

//         if (
//             authLoading ||
//             !id ||
//             !user
//         ) {
//             return;
//         }

//         let cancelled =
//             false;

//         let timeoutId:
//             ReturnType<
//                 typeof setTimeout
//             >;


//         const run = async () => {

//             if (cancelled) {
//                 return;
//             }

//             await fetchData();

//             if (
//                 !cancelled
//             ) {

//                 timeoutId =
//                     setTimeout(
//                         run,
//                         3000
//                     );

//             }

//         };


//         run();


//         return () => {

//             cancelled =
//                 true;

//             clearTimeout(
//                 timeoutId
//             );

//         };

//     }, [
//         authLoading,
//         user,
//         id,
//         fetchData,
//     ]);


//     // ============================================================
//     // OPEN DOCUMENT
//     // ============================================================

//     const handleOpen = (
//         doc: DocItem,
//         mode = "admin"
//     ) => {

//         if (!id) {
//             return;
//         }


//         switch (
//             doc.key
//         ) {

//             case "fintrac":
//                 router.push(
//                     `/(transactions)/party/fintrac/${id}?mode=${mode}` as any
//                 );
//                 break;


//             case "pep":
//                 router.push(
//                     `/(transactions)/party/politically-exposed/${id}?mode=${mode}` as any
//                 );
//                 break;


//             case "crg":
//                 router.push(
//                     `/(transactions)/party/crg/${id}?mode=${mode}` as any
//                 );
//                 break;


//             case "EBRADA":
//                 router.push(
//                     `/(transactions)/party/forms/EBRADA/${id}?mode=${mode}` as any
//                 );
//                 break;


//             case "EBRAA":
//                 router.push(
//                     `/(transactions)/party/forms/EBRAA/${id}?mode=${mode}` as any
//                 );
//                 break;


//             case "EBRATDA":
//                 router.push(
//                     `/(transactions)/party/forms/EBRATDA/${id}?mode=${mode}` as any
//                 );
//                 break;


//             case "RPC":
//                 router.push(
//                     `/(transactions)/party/forms/RPC/${id}?mode=${mode}` as any
//                 );
//                 break;


//             case "SCSAAFA":
//                 router.push(
//                     `/(transactions)/party/forms/SCSAAFA/${id}?mode=${mode}` as any
//                 );
//                 break;


//             case "IDMMGOL":
//                 router.push(
//                     `/(transactions)/party/forms/IDMMGOL/${id}?mode=${mode}` as any
//                 );
//                 break;


//             case "ESRAA":
//                 router.push(
//                     `/(transactions)/party/forms/ESRAA/${id}?mode=${mode}` as any
//                 );
//                 break;


//             default:
//                 Alert.alert(
//                     "Unavailable",
//                     "This document cannot be opened."
//                 );
//                 break;
//         }

//     };


//     // ============================================================
//     // SEND FOR SIGNATURE
//     // ============================================================

//     const handleSendForSign =
//         async (
//             doc: DocItem
//         ) => {

//             if (!id) {
//                 return;
//             }

//             let endpoint =
//                 "";


//             switch (
//                 doc.key
//             ) {

//                 case "crg":
//                     endpoint =
//                         "/crgpdf/send-crg-for-signature";
//                     break;

//                 case "EBRAA":
//                     endpoint =
//                         "/ebraapdf/send-buyer-amendment-for-signature";
//                     break;

//                 case "EBRADA":
//                     endpoint =
//                         "/ebradapdf/send-buyer-representation-for-signature";
//                     break;

//                 case "EBRATDA":
//                     endpoint =
//                         "/ebratdapdf/send-buyer-termination-for-signature";
//                     break;

//                 case "RPC":
//                     endpoint =
//                         "/rpcpdf/send-rpc-for-signature";
//                     break;

//                 case "SCSAAFA":
//                     endpoint =
//                         "/scsaafa/send-scsaafa-for-signature";
//                     break;

//                 case "ESRAA":
//                     endpoint =
//                         "/esraa/send-esraa-for-signature";
//                     break;

//                 case "IDMMGOL":
//                     endpoint =
//                         "/idmmgol/send-idmmgol-for-signature";
//                     break;

//                 default:
//                     Alert.alert(
//                         "Unavailable",
//                         "This document cannot be sent for signature."
//                     );
//                     return;
//             }


//             try {

//                 setSendingDoc(
//                     doc.name
//                 );


//                 const response =
//                     await fetch(
//                         `${API_BASE}${endpoint}`,
//                         {
//                             method: "POST",

//                             headers: {
//                                 "Content-Type":
//                                     "application/json",
//                             },

//                             body:
//                                 JSON.stringify({
//                                     partyId:
//                                         id,
//                                 }),
//                         }
//                     );


//                 let data: any;

//                 try {
//                     data =
//                         await response.json();
//                 } catch {
//                     throw new Error(
//                         "Invalid server response."
//                     );
//                 }


//                 if (!response.ok) {
//                     throw new Error(
//                         data?.message ||
//                         "Failed to send document."
//                     );
//                 }


//                 Alert.alert(
//                     "Success",
//                     data?.message ||
//                     "Email sent successfully."
//                 );


//                 await fetchData();

//             } catch (error: any) {

//                 console.error(
//                     "Send For Sign Error:",
//                     error
//                 );

//                 Alert.alert(
//                     "Error",
//                     error?.message ||
//                     "Something went wrong."
//                 );

//             } finally {

//                 setSendingDoc(
//                     null
//                 );

//             }

//         };


//     // ============================================================
//     // LOADING
//     // ============================================================

//     if (
//         authLoading ||
//         !id
//     ) {
//         return (
//             <View className="flex-1 items-center justify-center bg-gray-50">

//                 <ActivityIndicator
//                     size="large"
//                     color="#9a6a3a"
//                 />

//                 <Text className="mt-4 text-sm text-gray-500">
//                     Loading party documents...
//                 </Text>

//             </View>
//         );
//     }


//     // ============================================================
//     // RENDER TABLE SECTION
//     // ============================================================

//     const renderDocumentSection =
//         (
//             title: string,
//             data: DocItem[],
//             description: string
//         ) => {

//             return (
//                 <View className="mb-8">

//                     {/* SECTION HEADER */}

//                     <View className="mb-4 flex-row items-center justify-between">

//                         <View className="flex-1">

//                             <Text className="text-xl font-bold text-gray-800">
//                                 {title}
//                             </Text>

//                             <Text className="mt-1 text-sm text-gray-500">
//                                 {description}
//                             </Text>

//                         </View>

//                         <View className="ml-3 rounded-xl bg-[#9a6a3a]/10 px-3 py-2">

//                             <Text className="text-xs font-semibold text-[#9a6a3a]">
//                                 {data.length} Docs
//                             </Text>

//                         </View>

//                     </View>


//                     {/* DOCUMENTS */}

//                     <View className="gap-4">

//                         {data.map(
//                             (
//                                 doc,
//                                 index
//                             ) => (

//                                 <DocumentRow
//                                     key={
//                                         doc.key ||
//                                         index
//                                     }
//                                     doc={
//                                         doc
//                                     }
//                                     partyId={
//                                         id
//                                     }
//                                     onOpen={() =>
//                                         handleOpen(
//                                             doc,
//                                             "admin"
//                                         )
//                                     }
//                                     onSendForSign={() =>
//                                         handleSendForSign(
//                                             doc
//                                         )
//                                     }
//                                     onSignaturePress={() =>
//                                         setSignatureDoc(
//                                             doc
//                                         )
//                                     }
//                                     sending={
//                                         sendingDoc ===
//                                         doc.name
//                                     }
//                                 />

//                             )
//                         )}

//                     </View>

//                 </View>
//             );
//         };


//     // ============================================================
//     // UPLOADED DOCS CHECK
//     // ============================================================

//     const hasDocs =
//         !!(
//             docs.licenseImage ||
//             docs.passportImage
//         );


//     // ============================================================
//     // MAIN UI
//     // ============================================================

//     return (
//         <>
//             <Stack.Screen
//                 options={{
//                     title: "Party Documents",
//                 }}
//             />


//             <ScrollView
//                 className="flex-1 bg-gray-50"
//                 showsVerticalScrollIndicator={
//                     false
//                 }
//                 contentContainerStyle={{
//                     paddingHorizontal: 16,
//                     paddingTop: 16,
//                     paddingBottom: 40,
//                 }}
//             >

//                 {/* ==================================================
//                     HEADER
//                 ================================================== */}

//                 <View className="rounded-3xl border border-gray-200 bg-white p-5">

//                     <View className="flex-row items-center">

//                         {/* <Pressable
//                             onPress={() =>
//                                 router.back()
//                             }
//                             className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-gray-100"
//                         >

//                             <ArrowLeft
//                                 size={20}
//                                 color="#374151"
//                             />

//                         </Pressable> */}


//                         <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#9a6a3a]/10">

//                             <FileText
//                                 size={27}
//                                 color="#9a6a3a"
//                             />

//                         </View>


//                         <View className="ml-3 flex-1">

//                             <Text className="text-xl font-bold text-gray-800">
//                                 Party Documents
//                             </Text>

//                             <Text className="mt-1 text-sm text-gray-500">
//                                 View, manage, and track all transaction documents.
//                             </Text>

//                         </View>

//                     </View>


//                     {/* STATS */}

//                     <View className="mt-5 flex-row gap-2">

//                         <View className="flex-1 rounded-2xl bg-gray-100 px-2 py-3">

//                             <Text className="text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
//                                 General
//                             </Text>

//                             <Text className="mt-1 text-center text-lg font-bold text-gray-800">
//                                 {
//                                     general.length
//                                 }
//                             </Text>

//                         </View>


//                         <View className="flex-1 rounded-2xl bg-blue-50 px-2 py-3">

//                             <Text className="text-center text-[11px] font-semibold uppercase tracking-wide text-blue-600">
//                                 Buying
//                             </Text>

//                             <Text className="mt-1 text-center text-lg font-bold text-blue-700">
//                                 {
//                                     buying.length
//                                 }
//                             </Text>

//                         </View>


//                         <View className="flex-1 rounded-2xl bg-green-50 px-2 py-3">

//                             <Text className="text-center text-[11px] font-semibold uppercase tracking-wide text-green-600">
//                                 Selling
//                             </Text>

//                             <Text className="mt-1 text-center text-lg font-bold text-green-700">
//                                 {
//                                     selling.length
//                                 }
//                             </Text>

//                         </View>

//                     </View>


//                     {/* UPLOADED DOCS */}

//                     <Pressable
//                         disabled={
//                             !hasDocs
//                         }
//                         onPress={() =>
//                             setShowUploadedDocs(
//                                 true
//                             )
//                         }
//                         className={`mt-5 h-12 items-center justify-center rounded-2xl ${
//                             hasDocs
//                                 ? "bg-[#1f3a56]"
//                                 : "bg-gray-300"
//                         }`}
//                     >

//                         <Text
//                             className={`text-sm font-semibold ${
//                                 hasDocs
//                                     ? "text-white"
//                                     : "text-gray-500"
//                             }`}
//                         >
//                             View Uploaded Docs
//                         </Text>

//                     </Pressable>

//                 </View>


//                 {/* ==================================================
//                     CLIENT FINTRAC
//                 ================================================== */}

//                 {clientFintrac && (
//                     <View className="mt-6 rounded-3xl border border-gray-200 bg-white p-5">

//                         <Text className="mb-5 text-xl font-semibold text-gray-800">
//                             Client FINTRAC Declaration
//                         </Text>


//                         {/* PEP */}

//                         <View className="border-b border-gray-100 pb-4">

//                             <Text className="text-sm font-medium text-gray-700">
//                                 Politically Exposed Individual
//                             </Text>

//                             <View
//                                 className={`mt-2 self-start rounded-full px-3 py-1 ${
//                                     clientFintrac.clientPoliticallyExposed ===
//                                     "yes"
//                                         ? "bg-red-100"
//                                         : "bg-green-100"
//                                 }`}
//                             >

//                                 <Text
//                                     className={`text-sm font-semibold ${
//                                         clientFintrac.clientPoliticallyExposed ===
//                                         "yes"
//                                             ? "text-red-700"
//                                             : "text-green-700"
//                                     }`}
//                                 >
//                                     {
//                                         clientFintrac.clientPoliticallyExposed ||
//                                         "-"
//                                     }
//                                 </Text>

//                             </View>

//                         </View>


//                         {/* FAMILY GOVERNMENT */}

//                         <View className="border-b border-gray-100 py-4">

//                             <Text className="text-sm font-medium text-gray-700">
//                                 Family Member in Government / Politics
//                             </Text>

//                             <View
//                                 className={`mt-2 self-start rounded-full px-3 py-1 ${
//                                     clientFintrac.clientFamilyGovernment ===
//                                     "yes"
//                                         ? "bg-red-100"
//                                         : "bg-green-100"
//                                 }`}
//                             >

//                                 <Text
//                                     className={`text-sm font-semibold ${
//                                         clientFintrac.clientFamilyGovernment ===
//                                         "yes"
//                                             ? "text-red-700"
//                                             : "text-green-700"
//                                     }`}
//                                 >
//                                     {
//                                         clientFintrac.clientFamilyGovernment ||
//                                         "-"
//                                     }
//                                 </Text>

//                             </View>

//                         </View>


//                         {/* THIRD PARTY */}

//                         <View className="pt-4">

//                             <Text className="text-sm font-medium text-gray-700">
//                                 Acting on Behalf of Third Party
//                             </Text>

//                             <View
//                                 className={`mt-2 self-start rounded-full px-3 py-1 ${
//                                     clientFintrac.clientThirdParty ===
//                                     "yes"
//                                         ? "bg-red-100"
//                                         : "bg-green-100"
//                                 }`}
//                             >

//                                 <Text
//                                     className={`text-sm font-semibold ${
//                                         clientFintrac.clientThirdParty ===
//                                         "yes"
//                                             ? "text-red-700"
//                                             : "text-green-700"
//                                     }`}
//                                 >
//                                     {
//                                         clientFintrac.clientThirdParty ||
//                                         "-"
//                                     }
//                                 </Text>

//                             </View>

//                         </View>

//                     </View>
//                 )}


//                 {/* ==================================================
//                     DOCUMENT SECTIONS
//                 ================================================== */}

//                 <View className="mt-8">

//                     {renderDocumentSection(
//                         "PDF Templates",
//                         general,
//                         "General transaction documents"
//                     )}

//                     {renderDocumentSection(
//                         "Buying Documents",
//                         buying,
//                         "Buyer-related transaction documents"
//                     )}

//                     {renderDocumentSection(
//                         "Selling Documents",
//                         selling,
//                         "Seller-related transaction documents"
//                     )}

//                 </View>

//             </ScrollView>


//             {/* ============================================================
//                 UPLOADED DOCUMENTS MODAL
//             ============================================================ */}

//             <Modal
//                 visible={
//                     showUploadedDocs
//                 }
//                 animationType="slide"
//                 transparent
//                 onRequestClose={() =>
//                     setShowUploadedDocs(
//                         false
//                     )
//                 }
//             >

//                 <View className="flex-1 justify-end bg-black/50">

//                     <View className="max-h-[92%] rounded-t-3xl bg-white">

//                         {/* HEADER */}

//                         <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-5">

//                             <View className="flex-1">

//                                 <Text className="text-xl font-bold text-gray-800">
//                                     Uploaded Documents
//                                 </Text>

//                                 <Text className="mt-1 text-sm text-gray-500">
//                                     Preview uploaded identification documents.
//                                 </Text>

//                             </View>

//                             <Pressable
//                                 onPress={() =>
//                                     setShowUploadedDocs(
//                                         false
//                                     )
//                                 }
//                                 className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100"
//                             >

//                                 <X
//                                     size={
//                                         20
//                                     }
//                                     color="#374151"
//                                 />

//                             </Pressable>

//                         </View>


//                         <ScrollView
//                             showsVerticalScrollIndicator={
//                                 false
//                             }
//                             contentContainerStyle={{
//                                 padding: 20,
//                                 paddingBottom: 40,
//                             }}
//                         >

//                             {/* LICENSE */}

//                             <View className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">

//                                 <Text className="mb-3 text-base font-semibold text-gray-800">
//                                     Driving License
//                                 </Text>

//                                 {docs.licenseImage ? (

//                                     <Pressable
//                                         onPress={() =>
//                                             setPreviewImage(
//                                                 docs.licenseImage!
//                                             )
//                                         }
//                                     >

//                                         <Image
//                                             source={{
//                                                 uri: docs.licenseImage,
//                                             }}
//                                             className="h-56 w-full rounded-2xl"
//                                             resizeMode="cover"
//                                         />

//                                         <View className="mt-2 flex-row items-center justify-center">

//                                             <Text className="text-xs font-semibold text-[#9a6a3a]">
//                                                 Tap to Preview
//                                             </Text>

//                                         </View>

//                                     </Pressable>

//                                 ) : (

//                                     <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8">

//                                         <FileText
//                                             size={
//                                                 30
//                                             }
//                                             color="#9ca3af"
//                                         />

//                                         <Text className="mt-3 text-center text-sm text-gray-400">
//                                             Driving license not uploaded yet.
//                                         </Text>

//                                     </View>

//                                 )}

//                             </View>


//                             {/* PASSPORT */}

//                             <View className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

//                                 <Text className="mb-3 text-base font-semibold text-gray-800">
//                                     Passport
//                                 </Text>

//                                 {docs.passportImage ? (

//                                     <Pressable
//                                         onPress={() =>
//                                             setPreviewImage(
//                                                 docs.passportImage!
//                                             )
//                                         }
//                                     >

//                                         <Image
//                                             source={{
//                                                 uri: docs.passportImage,
//                                             }}
//                                             className="h-56 w-full rounded-2xl"
//                                             resizeMode="cover"
//                                         />

//                                         <View className="mt-2 flex-row items-center justify-center">

//                                             <Text className="text-xs font-semibold text-[#9a6a3a]">
//                                                 Tap to Preview
//                                             </Text>

//                                         </View>

//                                     </Pressable>

//                                 ) : (

//                                     <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8">

//                                         <FileText
//                                             size={
//                                                 30
//                                             }
//                                             color="#9ca3af"
//                                         />

//                                         <Text className="mt-3 text-center text-sm text-gray-400">
//                                             Passport not uploaded yet.
//                                         </Text>

//                                     </View>

//                                 )}

//                             </View>

//                         </ScrollView>

//                     </View>

//                 </View>

//             </Modal>


//             {/* ============================================================
//                 IMAGE PREVIEW MODAL
//             ============================================================ */}

//             <Modal
//                 visible={
//                     !!previewImage
//                 }
//                 animationType="fade"
//                 transparent
//                 onRequestClose={() =>
//                     setPreviewImage(
//                         null
//                     )
//                 }
//             >

//                 <View className="flex-1 items-center justify-center bg-black/90 px-4">

//                     <Pressable
//                         onPress={() =>
//                             setPreviewImage(
//                                 null
//                             )
//                         }
//                         className="absolute right-5 top-14 z-20 h-11 w-11 items-center justify-center rounded-full bg-white/20"
//                     >

//                         <X
//                             size={
//                                 22
//                             }
//                             color="#ffffff"
//                         />

//                     </Pressable>


//                     {previewImage && (
//                         <Image
//                             source={{
//                                 uri: previewImage,
//                             }}
//                             className="h-[75%] w-full"
//                             resizeMode="contain"
//                         />
//                     )}

//                 </View>

//             </Modal>


//             {/* ============================================================
//                 SIGNATURE PROGRESS MODAL
//             ============================================================ */}

//             <Modal
//                 visible={
//                     !!signatureDoc
//                 }
//                 animationType="slide"
//                 transparent
//                 onRequestClose={() =>
//                     setSignatureDoc(
//                         null
//                     )
//                 }
//             >

//                 <View className="flex-1 justify-end bg-black/50">

//                     {signatureDoc &&
//                         id && (
//                             <SignatureStatus
//                                 doc={
//                                     signatureDoc
//                                 }
//                                 partyId={
//                                     id
//                                 }
//                                 onClose={() =>
//                                     setSignatureDoc(
//                                         null
//                                     )
//                                 }
//                             />
//                         )}

//                 </View>

//             </Modal>

//         </>
//     );
// }