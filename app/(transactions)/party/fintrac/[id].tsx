import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "../../../../contexts/AuthContext";

const API_BASE = "https://realtorparth.ca/api";

interface FormData {
    propertyStreetNum: string;
    propertyStreet: string;
    propertyCity: string;
    propertyPostalCode: string;
    representativeName: string;
    brokerName: string;
    dateVerified: string;

    fullName: string;
    address: string;
    dob: string;
    occupation: string;

    idTypeDriver: boolean;
    idTypePassport: boolean;
    idTypeOther: boolean;
    idOtherExplain: string;

    confrm_invdul_nm_bdt: boolean;
    confrm_invdul_nm_addr: boolean;
    confrm_invdul_nm_financial: boolean;

    documentNumber: string;
    issuingJurisdiction: string;
    country: string;
    expiryDate: string;

    creditBureauName: string;
    creditFileReferenceNumber: string;

    dobSourceName: string;
    dobAccountNumber: string;

    addressSourceName: string;
    addressAccountNumber: string;

    financialSourceName: string;
    financialAccountType: string;
    financialAccountNumber: string;

    thirdPartyConducted: string;
    thirdPartyReason: string;
    thirdPartyName: string;
    thirdPartyAddress: string;
    thirdPartyPhone: string;
    thirdPartyDOB: string;
    thirdPartyOccupation: string;
    thirdPartyRegistration: string;
    thirdPartyRelationship: string;

    propertyTypeResidential: boolean;
    propertyTypeIncome: boolean;
    propertyTypeCommercial: boolean;
    propertyTypeLand: boolean;

    otherPropertyType: string;
    businessDescription: string;
    monitoringMeasures: string;
    enhancedMeasures: string;

    totalRiskScore?: number;
    riskLevel?: string;

    [key: string]: any;
}

interface TransactionUser {
    id?: string;
    _id?: string;
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
}

const INITIAL_FORM: FormData = {
    propertyStreetNum: "",
    propertyStreet: "",
    propertyCity: "",
    propertyPostalCode: "",
    representativeName: "",
    brokerName: "",
    dateVerified: "",

    fullName: "",
    address: "",
    dob: "",
    occupation: "",

    idTypeDriver: false,
    idTypePassport: false,
    idTypeOther: false,
    idOtherExplain: "",

    confrm_invdul_nm_bdt: false,
    confrm_invdul_nm_addr: false,
    confrm_invdul_nm_financial: false,

    documentNumber: "",
    issuingJurisdiction: "",
    country: "",
    expiryDate: "",

    creditBureauName: "",
    creditFileReferenceNumber: "",

    dobSourceName: "",
    dobAccountNumber: "",

    addressSourceName: "",
    addressAccountNumber: "",

    financialSourceName: "",
    financialAccountType: "",
    financialAccountNumber: "",

    thirdPartyConducted: "",
    thirdPartyReason: "",
    thirdPartyName: "",
    thirdPartyAddress: "",
    thirdPartyPhone: "",
    thirdPartyDOB: "",
    thirdPartyOccupation: "",
    thirdPartyRegistration: "",
    thirdPartyRelationship: "",

    propertyTypeResidential: false,
    propertyTypeIncome: false,
    propertyTypeCommercial: false,
    propertyTypeLand: false,

    otherPropertyType: "",
    businessDescription: "",
    monitoringMeasures: "",
    enhancedMeasures: "",

    totalRiskScore: 0,
    riskLevel: "Low Risk",
};

const QUESTIONS = [
    "Previously worked with client or personal relationship?",
    "Client has criminal history?",
    "Concern about money laundering location?",
    "Within 10 km of international border/airport?",
    "Is Canadian citizen or permanent resident?",
    "Domestic PEP?",
    "Foreign PEP or HIO?",
    "Subject to Ministerial Directive?",
    "Any other high-risk country connections?",
    "Attempted to conceal identity?",
    "Brokerage filed suspicious report before?",
    "Transaction unusual for occupation?",
    "Transaction involves third party?",
    "Non face-to-face identification?",
    "Deposit in cash?",
    "Unusual transaction history?",
    "Anything unusual about client?",
];

const SCORING: Record<
    number,
    { yes: number; no: number; possibly: number }
> = {
    1: { yes: 0, no: 2, possibly: 0 },
    2: { yes: 10, no: 0, possibly: 1 },
    3: { yes: 2, no: 0, possibly: 1 },
    4: { yes: 2, no: 0, possibly: 0 },
    5: { yes: 0, no: 2, possibly: 1 },
    6: { yes: 6, no: 0, possibly: 0 },
    7: { yes: 10, no: 0, possibly: 0 },
    8: { yes: 10, no: 0, possibly: 0 },
    9: { yes: 5, no: 0, possibly: 1 },
    10: { yes: 6, no: 0, possibly: 0 },
    11: { yes: 10, no: 0, possibly: 0 },
    12: { yes: 5, no: 0, possibly: 0 },
    13: { yes: 2, no: 0, possibly: 1 },
    14: { yes: 2, no: 0, possibly: 0 },
    15: { yes: 3, no: 0, possibly: 0 },
    16: { yes: 4, no: 0, possibly: 0 },
    17: { yes: 4, no: 0, possibly: 0 },
};

const getTransactionUserId = (
    user: TransactionUser | null
): string | null => {
    if (!user) return null;

    if (typeof user.id === "string" && user.id.trim()) {
        return user.id;
    }

    if (typeof user._id === "string" && user._id.trim()) {
        return user._id;
    }

    if (typeof user.userId === "string" && user.userId.trim()) {
        return user.userId;
    }

    return null;
};

const formatDateForInput = (date: any) => {
    if (!date) return "";

    if (
        typeof date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        return date;
    }

    if (typeof date === "string" && date.includes("/")) {
        const parts = date.split("/");

        if (parts.length === 3) {
            const [a, b, c] = parts;

            return `${c}-${b.padStart(2, "0")}-${a.padStart(
                2,
                "0"
            )}`;
        }
    }

    const parsed = new Date(date);

    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
    }

    return "";
};

const formatDisplayDate = (value: string) => {
    if (!value) return "";

    const date = new Date(`${value}T00:00:00`);

    if (isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-CA");
};

function SectionTitle({
    children,
    subtitle,
}: {
    children: React.ReactNode;
    subtitle?: string;
}) {
    return (
        <View className="mb-4">
            <Text className="text-lg font-bold text-gray-800">
                {children}
            </Text>

            {subtitle ? (
                <Text className="mt-1 text-sm leading-5 text-gray-500">
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );
}

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    maxLength,
    multiline = false,
    keyboardType,
    editable = true,
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    multiline?: boolean;
    keyboardType?: any;
    editable?: boolean;
}) {
    return (
        <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-gray-700">
                {label}
            </Text>

            <TextInput
                value={value ?? ""}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                maxLength={maxLength}
                multiline={multiline}
                numberOfLines={multiline ? 5 : 1}
                keyboardType={keyboardType}
                editable={editable}
                textAlignVertical={multiline ? "top" : "center"}
                className={`rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-800 ${multiline ? "min-h-[110px]" : ""
                    } ${!editable ? "bg-gray-100" : ""}`}
            />

            {maxLength ? (
                <Text className="mt-1 text-right text-xs text-gray-400">
                    {(value ?? "").length}/{maxLength}
                </Text>
            ) : null}
        </View>
    );
}

function Checkbox({
    label,
    checked,
    onPress,
}: {
    label: string;
    checked: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className="mb-3 flex-row items-center"
        >
            <View
                className={`mr-3 h-5 w-5 items-center justify-center rounded border ${checked
                        ? "border-[#B8860B] bg-[#B8860B]"
                        : "border-gray-400 bg-white"
                    }`}
            >
                {checked ? (
                    <Ionicons
                        name="checkmark"
                        size={14}
                        color="#ffffff"
                    />
                ) : null}
            </View>

            <Text className="flex-1 text-sm leading-5 text-gray-700">
                {label}
            </Text>
        </Pressable>
    );
}

function Radio({
    label,
    selected,
    onPress,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className="mr-6 flex-row items-center"
        >
            <View
                className={`mr-2 h-5 w-5 items-center justify-center rounded-full border ${selected
                        ? "border-[#B8860B]"
                        : "border-gray-400"
                    }`}
            >
                {selected ? (
                    <View className="h-2.5 w-2.5 rounded-full bg-[#B8860B]" />
                ) : null}
            </View>

            <Text className="text-sm text-gray-700">{label}</Text>
        </Pressable>
    );
}

function DateField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const [showPicker, setShowPicker] = useState(false);

    const dateValue = value
        ? new Date(`${value}T00:00:00`)
        : new Date();

    return (
        <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-gray-700">
                {label}
            </Text>

            <Pressable
                onPress={() => setShowPicker(true)}
                className="flex-row items-center justify-between rounded-xl border border-gray-300 bg-white px-3.5 py-3"
            >
                <Text
                    className={
                        value
                            ? "text-sm text-gray-800"
                            : "text-sm text-gray-400"
                    }
                >
                    {value
                        ? formatDisplayDate(value)
                        : `Select ${label.toLowerCase()}`}
                </Text>

                <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#6b7280"
                />
            </Pressable>

            {showPicker ? (
                <DateTimePicker
                    value={
                        isNaN(dateValue.getTime())
                            ? new Date()
                            : dateValue
                    }
                    mode="date"
                    display={
                        Platform.OS === "ios"
                            ? "spinner"
                            : "default"
                    }
                    onChange={(event, selectedDate) => {
                        if (Platform.OS !== "ios") {
                            setShowPicker(false);
                        }

                        if (selectedDate) {
                            const year =
                                selectedDate.getFullYear();
                            const month = String(
                                selectedDate.getMonth() + 1
                            ).padStart(2, "0");
                            const day = String(
                                selectedDate.getDate()
                            ).padStart(2, "0");

                            onChange(
                                `${year}-${month}-${day}`
                            );
                        }
                    }}
                />
            ) : null}

            {Platform.OS === "ios" && showPicker ? (
                <Pressable
                    onPress={() => setShowPicker(false)}
                    className="mt-2 self-end rounded-lg bg-gray-200 px-4 py-2"
                >
                    <Text className="font-medium text-gray-700">
                        Done
                    </Text>
                </Pressable>
            ) : null}
        </View>
    );
}

export default function AdminFintracForm() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        id?: string;
        mode?: string;
    }>();

    const { user } = useAuth();

    const id = Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    const mode = Array.isArray(params.mode)
        ? params.mode[0]
        : params.mode;

    const isAdmin = mode === "admin";

    const [checkingTransactionAuth, setCheckingTransactionAuth] =
        useState(isAdmin);

    const [transactionUserId, setTransactionUserId] =
        useState<string | null>(null);

    const [step, setStep] = useState(isAdmin ? 1 : 2);

    const [formData, setFormData] =
        useState<FormData>(INITIAL_FORM);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    /*
     * ============================
     * Resolve Transaction User
     * ============================
     *
     * Admin Panel -> Admin email
     * -> check-super-admin
     * -> Transaction user ID
     *
     * We intentionally do NOT depend on AsyncStorage.transactionUser.
     */
    useEffect(() => {
        let mounted = true;

        const resolveTransactionUser = async () => {
            if (!isAdmin) {
                if (mounted) {
                    setCheckingTransactionAuth(false);
                }
                return;
            }

            if (!user?.email) {
                if (mounted) {
                    setCheckingTransactionAuth(false);
                }
                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE}/transactions/check-super-admin/${encodeURIComponent(
                        user.email
                    )}`
                );

                const data = await response.json();

                if (
                    !response.ok ||
                    !data?.success ||
                    !data?.isSuperAdmin
                ) {
                    throw new Error(
                        "Transaction access could not be verified."
                    );
                }

                const transactionUser =
                    data.user ||
                    data.transactionUser ||
                    data.admin ||
                    data;

                const resolvedId =
                    getTransactionUserId(transactionUser);

                if (!resolvedId) {
                    throw new Error(
                        "Transaction user ID was not found."
                    );
                }

                if (mounted) {
                    setTransactionUserId(resolvedId);
                }
            } catch (error: any) {
                console.error(
                    "Transaction auth error:",
                    error
                );

                if (mounted) {
                    Alert.alert(
                        "Transaction Access",
                        error?.message ||
                        "Unable to verify transaction access."
                    );
                }
            } finally {
                if (mounted) {
                    setCheckingTransactionAuth(false);
                }
            }
        };

        resolveTransactionUser();

        return () => {
            mounted = false;
        };
    }, [isAdmin, user?.email]);

    /*
     * ============================
     * Load FINTRAC Data
     * ============================
     */
    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const controller = new AbortController();

                const timeout = setTimeout(
                    () => controller.abort(),
                    15000
                );

                const [
                    partyRes,
                    settingsRes,
                    fintracRes,
                ] = await Promise.all([
                    fetch(
                        `${API_BASE}/transactions/parties/transactionParty/settings/${id}`,
                        {
                            signal: controller.signal,
                        }
                    ),

                    fetch(
                        `${API_BASE}/admin/settings/by-party/${id}`,
                        {
                            signal: controller.signal,
                        }
                    ),

                    fetch(
                        `${API_BASE}/fintracpdf/fintrac/user/${id}`,
                        {
                            signal: controller.signal,
                        }
                    ),
                ]);

                clearTimeout(timeout);

                const parseJSON = async (res: Response) => {
                    try {
                        return await res.json();
                    } catch {
                        throw new Error(
                            "Invalid server response"
                        );
                    }
                };

                const [
                    partysettingsJson,
                    settingsJson,
                    fintracJson,
                ] = await Promise.all([
                    parseJSON(partyRes),
                    parseJSON(settingsRes),
                    parseJSON(fintracRes),
                ]);

                if (
                    !partyRes.ok ||
                    !settingsRes.ok ||
                    !fintracRes.ok
                ) {
                    throw new Error(
                        "Failed to load FINTRAC data."
                    );
                }

                const partysettings =
                    partysettingsJson?.data || {};

                const settings =
                    settingsJson?.data || {};

                const cleanData =
                    fintracJson?.data || {};

                /*
                 * AI extracted identity documents
                 */
                const passport =
                    partysettings?.identityData?.passport
                        ?.documentNumber
                        ? partysettings.identityData.passport
                        : null;

                const license =
                    partysettings?.identityData?.license
                        ?.documentNumber
                        ? partysettings.identityData.license
                        : null;

                const hasPassport = !!passport;
                const hasLicense = !!license;

                const primaryIdentity = hasPassport
                    ? passport
                    : hasLicense
                        ? license
                        : {};

                const secondaryIdentity =
                    hasPassport && hasLicense
                        ? license
                        : {};

                setFormData((prev) => ({
                    ...prev,

                    /*
                     * Existing FINTRAC
                     */
                    ...cleanData,

                    /*
                     * Brokerage
                     */
                    propertyStreetNum:
                        cleanData?.propertyStreetNum ||
                        prev.propertyStreetNum ||
                        settings?.brokerageStreetNum ||
                        "",

                    propertyStreet:
                        cleanData?.propertyStreet ||
                        prev.propertyStreet ||
                        settings?.brokerageStreet ||
                        "",

                    propertyCity:
                        cleanData?.propertyCity ||
                        prev.propertyCity ||
                        settings?.brokerageCity ||
                        "",

                    propertyPostalCode:
                        cleanData?.propertyPostalCode ||
                        prev.propertyPostalCode ||
                        settings?.brokeragePostalCode ||
                        "",

                    brokerName:
                        cleanData?.brokerName ||
                        prev.brokerName ||
                        settings?.brokerageName ||
                        "",

                    representativeName:
                        cleanData?.representativeName ||
                        prev.representativeName ||
                        settings?.repName ||
                        "",

                    /*
                     * Party / AI Data
                     */
                    fullName:
                        cleanData?.fullName ||
                        prev.fullName ||
                        primaryIdentity?.fullName ||
                        secondaryIdentity?.fullName ||
                        partysettings?.name ||
                        "",

                    address:
                        cleanData?.address ||
                        prev.address ||
                        primaryIdentity?.address ||
                        secondaryIdentity?.address ||
                        "",

                    dob: formatDateForInput(
                        primaryIdentity?.dateOfBirth ||
                        secondaryIdentity?.dateOfBirth ||
                        cleanData?.dob ||
                        prev.dob
                    ),

                    documentNumber:
                        cleanData?.documentNumber ||
                        prev.documentNumber ||
                        primaryIdentity?.documentNumber ||
                        secondaryIdentity?.documentNumber ||
                        "",

                    expiryDate: formatDateForInput(
                        primaryIdentity?.expiryDate ||
                        secondaryIdentity?.expiryDate ||
                        cleanData?.expiryDate ||
                        prev.expiryDate
                    ),

                    country:
                        cleanData?.country ||
                        prev.country ||
                        primaryIdentity?.nationality ||
                        primaryIdentity?.issuingCountry ||
                        secondaryIdentity?.nationality ||
                        secondaryIdentity?.issuingCountry ||
                        "",

                    issuingJurisdiction:
                        cleanData?.issuingJurisdiction ||
                        prev.issuingJurisdiction ||
                        primaryIdentity?.issuingProvince ||
                        primaryIdentity?.issuingCountry ||
                        secondaryIdentity?.issuingProvince ||
                        secondaryIdentity?.issuingCountry ||
                        "",

                    /*
                     * ID Type
                     */
                    idTypeDriver:
                        cleanData?.idTypeDriver ??
                        hasLicense,

                    idTypePassport:
                        cleanData?.idTypePassport ??
                        hasPassport,

                    idTypeOther:
                        cleanData?.idTypeOther ??
                        false,

                    /*
                     * Boolean fields
                     */
                    confrm_invdul_nm_bdt:
                        cleanData?.confrm_invdul_nm_bdt ??
                        false,

                    confrm_invdul_nm_addr:
                        cleanData?.confrm_invdul_nm_addr ??
                        false,

                    confrm_invdul_nm_financial:
                        cleanData?.confrm_invdul_nm_financial ??
                        false,

                    propertyTypeResidential:
                        cleanData?.propertyTypeResidential ??
                        false,

                    propertyTypeIncome:
                        cleanData?.propertyTypeIncome ??
                        false,

                    propertyTypeCommercial:
                        cleanData?.propertyTypeCommercial ??
                        false,

                    propertyTypeLand:
                        cleanData?.propertyTypeLand ??
                        false,
                }));

                if (fintracJson?.data) {
                    setIsSaved(true);
                }
            } catch (error: any) {
                console.error(
                    "FINTRAC LOAD ERROR:",
                    error
                );

                if (error?.name === "AbortError") {
                    Alert.alert(
                        "Timeout",
                        "The request timed out."
                    );
                } else {
                    Alert.alert(
                        "Error",
                        error?.message ||
                        "Failed to load FINTRAC data."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    const updateField = (
        name: keyof FormData,
        value: any
    ) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /*
     * ============================
     * Risk Score
     * ============================
     */
    const handleRiskChange = (
        questionNumber: number,
        value: string
    ) => {
        setFormData((prev) => {
            const updated: FormData = {
                ...prev,
                [`q${questionNumber}`]: value,
            };

            let total = 0;

            for (
                let i = 1;
                i <= QUESTIONS.length;
                i++
            ) {
                const answer =
                    updated[`q${i}`];

                if (answer) {
                    total +=
                        SCORING[i]?.[
                        answer as
                        | "yes"
                        | "no"
                        | "possibly"
                        ] || 0;
                }
            }

            updated.totalRiskScore = total;

            updated.riskLevel =
                total >= 10
                    ? "High Risk"
                    : "Low Risk";

            return updated;
        });
    };

    /*
     * ============================
     * Submit
     * ============================
     */
    const handleSubmit = async () => {
        if (!id) {
            Alert.alert(
                "Party Not Found",
                "The party could not be found."
            );
            return;
        }

        setSaving(true);

        try {
            const payload = {
                ...formData,
                partyId: id,
                isAdmin,
            };

            const controller = new AbortController();

            const timeout = setTimeout(
                () => controller.abort(),
                20000
            );

            const response = await fetch(
                `${API_BASE}/fintracpdf/generate-pdf`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                }
            );

            clearTimeout(timeout);

            if (!response.ok) {
                let message =
                    "Failed to generate FINTRAC PDF.";

                try {
                    const errorData =
                        await response.json();

                    message =
                        errorData?.message ||
                        errorData?.error ||
                        message;
                } catch {
                    // Keep default error
                }

                throw new Error(message);
            }

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            /*
             * =====================================================
             * PDF RESPONSE
             * =====================================================
             */

            if (
                contentType.includes(
                    "application/pdf"
                )
            ) {
                const arrayBuffer =
                    await response.arrayBuffer();

                const bytes = new Uint8Array(
                    arrayBuffer
                );

                /*
                 * Convert bytes to base64
                 */
                let binary = "";

                const chunkSize = 0x8000;

                for (
                    let i = 0;
                    i < bytes.length;
                    i += chunkSize
                ) {
                    const chunk = bytes.subarray(
                        i,
                        Math.min(
                            i + chunkSize,
                            bytes.length
                        )
                    );

                    binary += String.fromCharCode(
                        ...chunk
                    );
                }

                const base64 =
                    btoa(binary);

                /*
                 * =================================================
                 * FILE NAME
                 * =================================================
                 */

                const fileName =
                    "FINTRAC_Individual_Identification_Information_Record.pdf";

                /*
                 * =================================================
                 * SAVE FILE
                 * =================================================
                 */

                const fileUri =
                    `${FileSystem.cacheDirectory}${fileName}`;

                await FileSystem.writeAsStringAsync(
                    fileUri,
                    base64,
                    {
                        encoding:
                            FileSystem.EncodingType
                                .Base64,
                    }
                );

                setIsSaved(true);

                /*
                 * =================================================
                 * OPEN / SHARE PDF
                 * =================================================
                 */

                const canShare =
                    await Sharing.isAvailableAsync();

                if (canShare) {
                    await Sharing.shareAsync(
                        fileUri,
                        {
                            mimeType:
                                "application/pdf",
                            dialogTitle:
                                "FINTRAC PDF",
                            UTI:
                                "com.adobe.pdf",
                        }
                    );
                } else {
                    Alert.alert(
                        "Success",
                        "FINTRAC PDF generated successfully."
                    );
                }

                /*
                 * =================================================
                 * ADMIN
                 * =================================================
                 */

                if (isAdmin) {
                    return;
                }

                /*
                 * =================================================
                 * NORMAL USER
                 * =================================================
                 */

                Alert.alert(
                    "Success",
                    "FINTRAC form saved successfully.",
                    [
                        {
                            text: "Continue",
                            onPress: () =>
                                router.replace(
                                    `/(transactions)/party/politically-exposed/${id}` as any
                                ),
                        },
                    ]
                );

                return;
            }

            /*
             * =====================================================
             * JSON RESPONSE
             * =====================================================
             */

            let data: any = null;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    "Invalid server response."
                );
            }

            if (
                data?.success === false
            ) {
                throw new Error(
                    data?.message ||
                    "Failed to save FINTRAC."
                );
            }

            setIsSaved(true);

            Alert.alert(
                "Success",
                "FINTRAC form saved successfully.",
                [
                    {
                        text: "Continue",
                        onPress: () =>
                            router.replace(
                                `/(transactions)/party/politically-exposed/${id}` as any
                            ),
                    },
                ]
            );
        } catch (error: any) {
            console.error(
                "FINTRAC SUBMIT ERROR:",
                error
            );

            if (
                error?.name ===
                "AbortError"
            ) {
                Alert.alert(
                    "Timeout",
                    "The request timed out."
                );
            } else {
                Alert.alert(
                    "Error",
                    error?.message ||
                    "Error generating FINTRAC PDF."
                );
            }
        } finally {
            setSaving(false);
        }
    };
    // const handleSubmit = async () => {
    //     if (!id) {
    //         Alert.alert(
    //             "Party Not Found",
    //             "The party could not be found."
    //         );
    //         return;
    //     }

    //     setSaving(true);

    //     try {
    //         const payload = {
    //             ...formData,
    //             partyId: id,
    //         };

    //         const controller = new AbortController();

    //         const timeout = setTimeout(
    //             () => controller.abort(),
    //             20000
    //         );

    //         const response = await fetch(
    //             `${API_BASE}/fintracpdf/generate-pdf`,
    //             {
    //                 method: "POST",
    //                 headers: {
    //                     "Content-Type":
    //                         "application/json",
    //                 },
    //                 body: JSON.stringify(payload),
    //                 signal: controller.signal,
    //             }
    //         );

    //         clearTimeout(timeout);

    //         if (!response.ok) {
    //             let message =
    //                 "Failed to generate FINTRAC PDF.";

    //             try {
    //                 const errorData =
    //                     await response.json();

    //                 message =
    //                     errorData?.message ||
    //                     message;
    //             } catch {
    //                 // Keep default message
    //             }

    //             throw new Error(message);
    //         }

    //         /*
    //          * Website receives a PDF blob.
    //          *
    //          * On native mobile we don't use
    //          * window.URL/createObjectURL.
    //          *
    //          * The backend has already generated/
    //          * saved the FINTRAC document.
    //          */
    //         try {
    //             await response.arrayBuffer();
    //         } catch {
    //             // PDF body isn't required for navigation.
    //         }

    //         setIsSaved(true);

    //         if (isAdmin) {
    //             Alert.alert(
    //                 "Success",
    //                 "FINTRAC form updated successfully.",
    //                 [
    //                     {
    //                         text: "OK",
    //                     },
    //                 ]
    //             );
    //         } else {
    //             Alert.alert(
    //                 "Success",
    //                 "FINTRAC form saved successfully.",
    //                 [
    //                     {
    //                         text: "Continue",
    //                         onPress: () =>
    //                             router.replace(
    //                                 `/(transactions)/party/politically-exposed/${id}` as any
    //                             ),
    //                     },
    //                 ]
    //             );
    //         }
    //     } catch (error: any) {
    //         console.error(
    //             "FINTRAC SUBMIT ERROR:",
    //             error
    //         );

    //         if (error?.name === "AbortError") {
    //             Alert.alert(
    //                 "Timeout",
    //                 "The request timed out."
    //             );
    //         } else {
    //             Alert.alert(
    //                 "Error",
    //                 error?.message ||
    //                     "Error generating FINTRAC PDF."
    //             );
    //         }
    //     } finally {
    //         setSaving(false);
    //     }
    // };

    /*
     * ============================
     * Loading
     * ============================
     */
    if (checkingTransactionAuth || loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <ActivityIndicator
                    size="large"
                    color="#B8860B"
                />

                <Text className="mt-4 text-sm text-gray-500">
                    {checkingTransactionAuth
                        ? "Checking transaction authentication..."
                        : "Loading FINTRAC form..."}
                </Text>
            </View>
        );
    }

    /*
     * Admin mode requires a resolved transaction
     * user before continuing.
     */
    if (
        isAdmin &&
        user?.email &&
        !transactionUserId
    ) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <Ionicons
                    name="alert-circle-outline"
                    size={42}
                    color="#dc2626"
                />

                <Text className="mt-3 text-center text-lg font-bold text-gray-800">
                    Transaction access unavailable
                </Text>

                <Text className="mt-2 text-center text-sm text-gray-500">
                    We could not resolve your transaction
                    account.
                </Text>

                <Pressable
                    onPress={() =>
                        router.back()
                    }
                    className="mt-5 rounded-xl bg-gray-800 px-5 py-3"
                >
                    <Text className="font-semibold text-white">
                        Go Back
                    </Text>
                </Pressable>
            </View>
        );
    }

    const steps = isAdmin
        ? ["A", "B", "C", "D"]
        : ["B", "C", "D"];

    const stepOffset = isAdmin ? 0 : 1;

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-50"
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 40,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* {isAdmin ? (
                    <View className="mb-4 flex-row items-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={20}
                            color="#2563eb"
                        />

                        <Text className="ml-2 flex-1 text-sm font-medium text-blue-700">
                            Admin Mode – You can edit but not
                            change workflow
                        </Text>
                    </View>
                ) : null} */}

                <View className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
                    <View className="flex-row items-center">
                        <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#B8860B]">
                            <Ionicons
                                name="document-text-outline"
                                size={23}
                                color="#ffffff"
                            />
                        </View>

                        <View className="ml-3 flex-1">
                            <Text className="text-xl font-bold text-gray-800">
                                FINTRAC
                            </Text>

                            <Text className="mt-1 text-sm text-gray-500">
                                Individual Identification
                                Information Record
                            </Text>
                        </View>

                        {isSaved ? (
                            <View className="rounded-full bg-green-50 px-2.5 py-1">
                                <Text className="text-xs font-semibold text-green-700">
                                    Saved
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* ================= STEP INDICATOR ================= */}

                <View className="mb-6 rounded-2xl bg-white p-4">
                    <View className="flex-row items-center justify-between">
                        {steps.map((label, index) => {
                            const actualStep =
                                index + 1 + stepOffset;

                            const active =
                                step === actualStep;

                            const completed =
                                step > actualStep;

                            return (
                                <React.Fragment
                                    key={label}
                                >
                                    <View className="items-center">
                                        <View
                                            className={`h-9 w-9 items-center justify-center rounded-full ${active ||
                                                    completed
                                                    ? "bg-[#B8860B]"
                                                    : "bg-gray-300"
                                                }`}
                                        >
                                            {completed ? (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={18}
                                                    color="#ffffff"
                                                />
                                            ) : (
                                                <Text className="font-bold text-white">
                                                    {label}
                                                </Text>
                                            )}
                                        </View>

                                        <Text
                                            className={`mt-1 text-xs ${active
                                                    ? "font-semibold text-[#8B6508]"
                                                    : "text-gray-400"
                                                }`}
                                        >
                                            {label === "A"
                                                ? "Property"
                                                : label === "B"
                                                    ? "Third Party"
                                                    : label === "C"
                                                        ? "Risk"
                                                        : "Business"}
                                        </Text>
                                    </View>

                                    {index <
                                        steps.length - 1 ? (
                                        <View
                                            className={`mx-2 h-0.5 flex-1 ${step >
                                                    actualStep
                                                    ? "bg-[#B8860B]"
                                                    : "bg-gray-200"
                                                }`}
                                        />
                                    ) : null}
                                </React.Fragment>
                            );
                        })}
                    </View>
                </View>

                {/* ================= STEP 1 ================= */}

                {isAdmin && step === 1 ? (
                    <View className="rounded-2xl bg-white p-5">
                        <SectionTitle>
                            Transaction Property Address
                        </SectionTitle>

                        <Field
                            label="Street Number"
                            value={
                                formData.propertyStreetNum
                            }
                            placeholder="Street Number"
                            keyboardType="number-pad"
                            maxLength={10}
                            onChangeText={(value) =>
                                updateField(
                                    "propertyStreetNum",
                                    value
                                        .replace(/\D/g, "")
                                        .slice(
                                            0,
                                            10
                                        )
                                )
                            }
                        />

                        <Field
                            label="Street"
                            value={
                                formData.propertyStreet
                            }
                            placeholder="Street"
                            onChangeText={(value) =>
                                updateField(
                                    "propertyStreet",
                                    value
                                )
                            }
                        />

                        <Field
                            label="City"
                            value={
                                formData.propertyCity
                            }
                            placeholder="City"
                            onChangeText={(value) =>
                                updateField(
                                    "propertyCity",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Postal Code"
                            value={
                                formData.propertyPostalCode
                            }
                            placeholder="A1A 1A1"
                            maxLength={7}
                            onChangeText={(value) => {
                                let formatted =
                                    value
                                        .toUpperCase()
                                        .replace(
                                            /[^A-Z0-9]/g,
                                            ""
                                        );

                                if (
                                    formatted.length >
                                    3
                                ) {
                                    formatted =
                                        formatted.slice(
                                            0,
                                            3
                                        ) +
                                        " " +
                                        formatted.slice(
                                            3,
                                            6
                                        );
                                }

                                updateField(
                                    "propertyPostalCode",
                                    formatted.slice(
                                        0,
                                        7
                                    )
                                );
                            }}
                        />

                        <SectionTitle>
                            Representative
                        </SectionTitle>

                        <Field
                            label="Representative Name"
                            value={
                                formData.representativeName
                            }
                            placeholder="Representative Name"
                            onChangeText={(value) =>
                                updateField(
                                    "representativeName",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Broker Name"
                            value={
                                formData.brokerName
                            }
                            placeholder="Broker Name"
                            onChangeText={(value) =>
                                updateField(
                                    "brokerName",
                                    value
                                )
                            }
                        />

                        <DateField
                            label="Date Verified"
                            value={
                                formData.dateVerified
                            }
                            onChange={(value) =>
                                updateField(
                                    "dateVerified",
                                    value
                                )
                            }
                        />

                        <SectionTitle>
                            Verification of Individual
                        </SectionTitle>

                        <Field
                            label="Full Name"
                            value={formData.fullName}
                            placeholder="Full Name"
                            maxLength={60}
                            onChangeText={(value) =>
                                updateField(
                                    "fullName",
                                    value.slice(
                                        0,
                                        60
                                    )
                                )
                            }
                        />

                        <Field
                            label="Address"
                            value={formData.address}
                            placeholder="Address"
                            maxLength={80}
                            onChangeText={(value) =>
                                updateField(
                                    "address",
                                    value.slice(
                                        0,
                                        80
                                    )
                                )
                            }
                        />

                        <DateField
                            label="D.O.B."
                            value={formData.dob}
                            onChange={(value) =>
                                updateField(
                                    "dob",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Occupation"
                            value={
                                formData.occupation
                            }
                            placeholder="Occupation"
                            maxLength={120}
                            onChangeText={(value) =>
                                updateField(
                                    "occupation",
                                    value.slice(
                                        0,
                                        120
                                    )
                                )
                            }
                        />

                        <SectionTitle>
                            Photo Identification
                        </SectionTitle>

                        <Checkbox
                            label="Driver License"
                            checked={
                                formData.idTypeDriver
                            }
                            onPress={() =>
                                updateField(
                                    "idTypeDriver",
                                    !formData.idTypeDriver
                                )
                            }
                        />

                        <Checkbox
                            label="Passport"
                            checked={
                                formData.idTypePassport
                            }
                            onPress={() =>
                                updateField(
                                    "idTypePassport",
                                    !formData.idTypePassport
                                )
                            }
                        />

                        <Checkbox
                            label="Other"
                            checked={
                                formData.idTypeOther
                            }
                            onPress={() =>
                                updateField(
                                    "idTypeOther",
                                    !formData.idTypeOther
                                )
                            }
                        />

                        {formData.idTypeOther ? (
                            <Field
                                label="Explain"
                                value={
                                    formData.idOtherExplain
                                }
                                placeholder="Please specify other ID type"
                                onChangeText={(value) =>
                                    updateField(
                                        "idOtherExplain",
                                        value
                                    )
                                }
                            />
                        ) : null}

                        <Field
                            label="Document Number"
                            value={
                                formData.documentNumber
                            }
                            placeholder="Document Number"
                            maxLength={120}
                            onChangeText={(value) =>
                                updateField(
                                    "documentNumber",
                                    value.slice(
                                        0,
                                        120
                                    )
                                )
                            }
                        />

                        <Field
                            label="Issuing Jurisdiction"
                            value={
                                formData.issuingJurisdiction
                            }
                            placeholder="Issuing Jurisdiction"
                            maxLength={120}
                            onChangeText={(value) =>
                                updateField(
                                    "issuingJurisdiction",
                                    value.slice(
                                        0,
                                        120
                                    )
                                )
                            }
                        />

                        <Field
                            label="Country"
                            value={
                                formData.country
                            }
                            placeholder="Country"
                            maxLength={20}
                            onChangeText={(value) =>
                                updateField(
                                    "country",
                                    value.slice(
                                        0,
                                        20
                                    )
                                )
                            }
                        />

                        <DateField
                            label="Expiry Date"
                            value={
                                formData.expiryDate
                            }
                            onChange={(value) =>
                                updateField(
                                    "expiryDate",
                                    value
                                )
                            }
                        />

                        <SectionTitle>
                            Credit File Method
                        </SectionTitle>

                        <Field
                            label="Bureau Name"
                            value={
                                formData.creditBureauName
                            }
                            placeholder="Canadian Credit Bureau Name"
                            maxLength={120}
                            onChangeText={(value) =>
                                updateField(
                                    "creditBureauName",
                                    value.slice(
                                        0,
                                        120
                                    )
                                )
                            }
                        />

                        <Field
                            label="File Reference Number"
                            value={
                                formData.creditFileReferenceNumber
                            }
                            placeholder="Credit File Reference Number"
                            maxLength={120}
                            onChangeText={(value) =>
                                updateField(
                                    "creditFileReferenceNumber",
                                    value.slice(
                                        0,
                                        120
                                    )
                                )
                            }
                        />

                        <SectionTitle
                            subtitle="Complete two of the following three options."
                        >
                            Dual ID Process Method
                        </SectionTitle>

                        <Checkbox
                            label="Confirm individual's name and date of birth"
                            checked={
                                formData.confrm_invdul_nm_bdt
                            }
                            onPress={() =>
                                updateField(
                                    "confrm_invdul_nm_bdt",
                                    !formData.confrm_invdul_nm_bdt
                                )
                            }
                        />

                        <Field
                            label="DOB Source Name"
                            value={
                                formData.dobSourceName
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "dobSourceName",
                                    value
                                )
                            }
                        />

                        <Field
                            label="DOB Account Number"
                            value={
                                formData.dobAccountNumber
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "dobAccountNumber",
                                    value
                                )
                            }
                        />

                        <Checkbox
                            label="Confirm individual's name and address"
                            checked={
                                formData.confrm_invdul_nm_addr
                            }
                            onPress={() =>
                                updateField(
                                    "confrm_invdul_nm_addr",
                                    !formData.confrm_invdul_nm_addr
                                )
                            }
                        />

                        <Field
                            label="Address Source Name"
                            value={
                                formData.addressSourceName
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "addressSourceName",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Address Account Number"
                            value={
                                formData.addressAccountNumber
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "addressAccountNumber",
                                    value
                                )
                            }
                        />

                        <Checkbox
                            label="Confirm individual's name and financial account"
                            checked={
                                formData.confrm_invdul_nm_financial
                            }
                            onPress={() =>
                                updateField(
                                    "confrm_invdul_nm_financial",
                                    !formData.confrm_invdul_nm_financial
                                )
                            }
                        />

                        <Field
                            label="Financial Source Name"
                            value={
                                formData.financialSourceName
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "financialSourceName",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Financial Account Type"
                            value={
                                formData.financialAccountType
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "financialAccountType",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Financial Account Number"
                            value={
                                formData.financialAccountNumber
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "financialAccountNumber",
                                    value
                                )
                            }
                        />
                    </View>
                ) : null}

                {/* ================= STEP 2 ================= */}

                {step === 2 ? (
                    <View className="rounded-2xl bg-white p-5">
                        <SectionTitle>
                            Are you dealing for third party?
                        </SectionTitle>

                        <View className="mb-5 flex-row">
                            <Radio
                                label="Yes"
                                selected={
                                    formData.thirdPartyConducted ===
                                    "yes"
                                }
                                onPress={() =>
                                    updateField(
                                        "thirdPartyConducted",
                                        "yes"
                                    )
                                }
                            />

                            <Radio
                                label="No"
                                selected={
                                    formData.thirdPartyConducted ===
                                    "no"
                                }
                                onPress={() =>
                                    updateField(
                                        "thirdPartyConducted",
                                        "no"
                                    )
                                }
                            />
                        </View>

                        {formData.thirdPartyConducted ===
                            "yes" ? (
                            <>
                                <Field
                                    label="Third Party Reason"
                                    value={
                                        formData.thirdPartyReason
                                    }
                                    placeholder="Explain reason"
                                    maxLength={250}
                                    multiline
                                    onChangeText={(value) =>
                                        updateField(
                                            "thirdPartyReason",
                                            value.slice(
                                                0,
                                                250
                                            )
                                        )
                                    }
                                />

                                <SectionTitle>
                                    Third Party Record
                                </SectionTitle>

                                <Field
                                    label="Third Party Name"
                                    value={
                                        formData.thirdPartyName
                                    }
                                    placeholder="Third Party Name"
                                    maxLength={120}
                                    onChangeText={(value) =>
                                        updateField(
                                            "thirdPartyName",
                                            value.slice(
                                                0,
                                                120
                                            )
                                        )
                                    }
                                />

                                <Field
                                    label="Third Party Address"
                                    value={
                                        formData.thirdPartyAddress
                                    }
                                    placeholder="Address"
                                    maxLength={120}
                                    onChangeText={(value) =>
                                        updateField(
                                            "thirdPartyAddress",
                                            value.slice(
                                                0,
                                                120
                                            )
                                        )
                                    }
                                />

                                <Field
                                    label="Third Party Phone"
                                    value={
                                        formData.thirdPartyPhone
                                    }
                                    placeholder="Third Party Phone"
                                    maxLength={20}
                                    keyboardType="phone-pad"
                                    onChangeText={(value) =>
                                        updateField(
                                            "thirdPartyPhone",
                                            value.slice(
                                                0,
                                                20
                                            )
                                        )
                                    }
                                />

                                <DateField
                                    label="Third Party DOB"
                                    value={
                                        formData.thirdPartyDOB
                                    }
                                    onChange={(value) =>
                                        updateField(
                                            "thirdPartyDOB",
                                            value
                                        )
                                    }
                                />

                                <Field
                                    label="Third Party Occupation"
                                    value={
                                        formData.thirdPartyOccupation
                                    }
                                    placeholder="Occupation"
                                    maxLength={120}
                                    onChangeText={(value) =>
                                        updateField(
                                            "thirdPartyOccupation",
                                            value.slice(
                                                0,
                                                120
                                            )
                                        )
                                    }
                                />

                                <Field
                                    label="Third Party Registration"
                                    value={
                                        formData.thirdPartyRegistration
                                    }
                                    placeholder="Registration or Incorporation Number"
                                    maxLength={120}
                                    onChangeText={(value) =>
                                        updateField(
                                            "thirdPartyRegistration",
                                            value.slice(
                                                0,
                                                120
                                            )
                                        )
                                    }
                                />

                                <Field
                                    label="Third Party Relationship"
                                    value={
                                        formData.thirdPartyRelationship
                                    }
                                    placeholder="Relationship"
                                    maxLength={100}
                                    multiline
                                    onChangeText={(value) =>
                                        updateField(
                                            "thirdPartyRelationship",
                                            value.slice(
                                                0,
                                                100
                                            )
                                        )
                                    }
                                />
                            </>
                        ) : null}
                    </View>
                ) : null}

                {/* ================= STEP 3 ================= */}

                {step === 3 ? (
                    <View className="rounded-2xl bg-white p-5">
                        <SectionTitle subtitle="Part 1: Answer the following questions by selecting Yes, No, or Possibly.">
                            C. Client Risk
                        </SectionTitle>

                        {QUESTIONS.map(
                            (question, index) => {
                                const qNum = index + 1;

                                const showPossibly =
                                    SCORING[qNum]
                                        .possibly > 0;

                                const label =
                                    qNum === 5
                                        ? "Unknown"
                                        : "Possibly";

                                return (
                                    <View
                                        key={qNum}
                                        className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4"
                                    >
                                        <View className="mb-3 flex-row">
                                            <View className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-gray-800">
                                                <Text className="text-xs font-bold text-white">
                                                    {qNum}
                                                </Text>
                                            </View>

                                            <Text className="flex-1 text-sm font-medium leading-5 text-gray-800">
                                                {question}
                                            </Text>
                                        </View>

                                        <View className="flex-row flex-wrap">
                                            <Radio
                                                label="Yes"
                                                selected={
                                                    formData[
                                                    `q${qNum}`
                                                    ] ===
                                                    "yes"
                                                }
                                                onPress={() =>
                                                    handleRiskChange(
                                                        qNum,
                                                        "yes"
                                                    )
                                                }
                                            />

                                            <Radio
                                                label="No"
                                                selected={
                                                    formData[
                                                    `q${qNum}`
                                                    ] ===
                                                    "no"
                                                }
                                                onPress={() =>
                                                    handleRiskChange(
                                                        qNum,
                                                        "no"
                                                    )
                                                }
                                            />

                                            {showPossibly ? (
                                                <Radio
                                                    label={
                                                        label
                                                    }
                                                    selected={
                                                        formData[
                                                        `q${qNum}`
                                                        ] ===
                                                        "possibly"
                                                    }
                                                    onPress={() =>
                                                        handleRiskChange(
                                                            qNum,
                                                            "possibly"
                                                        )
                                                    }
                                                />
                                            ) : null}
                                        </View>
                                    </View>
                                );
                            }
                        )}

                        <View className="mt-1 rounded-xl border border-gray-200 bg-white p-4">
                            <View className="flex-row items-center justify-between">
                                <Text className="font-semibold text-gray-700">
                                    Total Risk Score
                                </Text>

                                <Text className="text-xl font-bold text-gray-800">
                                    {formData.totalRiskScore ||
                                        0}
                                </Text>
                            </View>

                            <View className="mt-3 flex-row items-center justify-between">
                                <Text className="font-semibold text-gray-700">
                                    Risk Level
                                </Text>

                                <View
                                    className={`rounded-full px-3 py-1 ${formData.riskLevel ===
                                            "High Risk"
                                            ? "bg-red-100"
                                            : "bg-green-100"
                                        }`}
                                >
                                    <Text
                                        className={`text-xs font-bold ${formData.riskLevel ===
                                                "High Risk"
                                                ? "text-red-700"
                                                : "text-green-700"
                                            }`}
                                    >
                                        {formData.riskLevel ||
                                            "Low Risk"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : null}

                {/* ================= STEP 4 ================= */}

                {step === 4 ? (
                    <View className="rounded-2xl bg-white p-5">
                        <SectionTitle>
                            Business Relationship
                        </SectionTitle>

                        <Checkbox
                            label="Residential Property"
                            checked={
                                formData.propertyTypeResidential
                            }
                            onPress={() =>
                                updateField(
                                    "propertyTypeResidential",
                                    !formData.propertyTypeResidential
                                )
                            }
                        />

                        <Checkbox
                            label="Residential Income"
                            checked={
                                formData.propertyTypeIncome
                            }
                            onPress={() =>
                                updateField(
                                    "propertyTypeIncome",
                                    !formData.propertyTypeIncome
                                )
                            }
                        />

                        <Checkbox
                            label="Commercial"
                            checked={
                                formData.propertyTypeCommercial
                            }
                            onPress={() =>
                                updateField(
                                    "propertyTypeCommercial",
                                    !formData.propertyTypeCommercial
                                )
                            }
                        />

                        <Checkbox
                            label="Land for Commercial Use"
                            checked={
                                formData.propertyTypeLand
                            }
                            onPress={() =>
                                updateField(
                                    "propertyTypeLand",
                                    !formData.propertyTypeLand
                                )
                            }
                        />

                        <Field
                            label="Other Property Type"
                            value={
                                formData.otherPropertyType
                            }
                            placeholder="Other property type"
                            maxLength={120}
                            onChangeText={(value) =>
                                updateField(
                                    "otherPropertyType",
                                    value.slice(
                                        0,
                                        120
                                    )
                                )
                            }
                        />

                        <Field
                            label="Business Description"
                            value={
                                formData.businessDescription
                            }
                            placeholder="Describe your business dealings with the client"
                            maxLength={250}
                            multiline
                            onChangeText={(value) =>
                                updateField(
                                    "businessDescription",
                                    value.slice(
                                        0,
                                        250
                                    )
                                )
                            }
                        />

                        <Field
                            label="Monitoring Measures"
                            value={
                                formData.monitoringMeasures
                            }
                            placeholder="Monitoring measures"
                            maxLength={2000}
                            multiline
                            onChangeText={(value) =>
                                updateField(
                                    "monitoringMeasures",
                                    value.slice(
                                        0,
                                        2000
                                    )
                                )
                            }
                        />

                        <Field
                            label="Enhanced Measures"
                            value={
                                formData.enhancedMeasures
                            }
                            placeholder="Enhanced measures to monitor the brokerage's business relationship"
                            maxLength={2000}
                            multiline
                            onChangeText={(value) =>
                                updateField(
                                    "enhancedMeasures",
                                    value.slice(
                                        0,
                                        2000
                                    )
                                )
                            }
                        />

                        <View className="mt-1 rounded-xl bg-yellow-50 p-4">
                            <Text className="text-sm leading-5 text-yellow-800">
                                If the client is high risk
                                you must conduct enhanced
                                monitoring measures.
                            </Text>
                        </View>

                        <SectionTitle>
                            Suspicious Transactions
                        </SectionTitle>

                        <Text className="mb-5 text-sm leading-5 text-gray-500">
                            Report suspicious activity to
                            your Compliance Officer.
                        </Text>

                        <SectionTitle>
                            Listed Person or Entity Property
                            Reports
                        </SectionTitle>

                        <Text className="text-sm leading-5 text-gray-500">
                            Follow brokerage procedures for
                            listed person or entity reports.
                        </Text>
                    </View>
                ) : null}

                {/* ================= NAVIGATION ================= */}

                {isAdmin ? (
                    <View className="mt-5 border-t border-gray-200 pt-5">
                        <Pressable
                            onPress={() =>
                                router.push(
                                    `/(transactions)/partypdfdata/${id}` as any
                                )
                            }
                            className="mb-3 flex-row items-center justify-center rounded-xl bg-gray-100 px-4 py-3.5"
                        >
                            <Ionicons
                                name="documents-outline"
                                size={19}
                                color="#374151"
                            />

                            <Text className="ml-2 font-semibold text-gray-700">
                                Party Docs List
                            </Text>
                        </Pressable>

                        <View className="flex-row">
                            {step > 1 ? (
                                <Pressable
                                    onPress={() =>
                                        setStep(
                                            (current) =>
                                                current -
                                                1
                                        )
                                    }
                                    className="mr-2 flex-1 flex-row items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3.5"
                                >
                                    <Ionicons
                                        name="arrow-back"
                                        size={18}
                                        color="#374151"
                                    />

                                    <Text className="ml-2 font-semibold text-gray-700">
                                        Previous
                                    </Text>
                                </Pressable>
                            ) : null}

                            {step < 4 ? (
                                <Pressable
                                    onPress={() =>
                                        setStep(
                                            (current) =>
                                                current +
                                                1
                                        )
                                    }
                                    className="flex-1 flex-row items-center justify-center rounded-xl bg-[#B8860B] px-4 py-3.5"
                                >
                                    <Text className="mr-2 font-bold text-white">
                                        Next
                                    </Text>

                                    <Ionicons
                                        name="arrow-forward"
                                        size={18}
                                        color="#ffffff"
                                    />
                                </Pressable>
                            ) : (
                                <Pressable
                                    onPress={handleSubmit}
                                    disabled={saving}
                                    className={`flex-1 flex-row items-center justify-center rounded-xl px-4 py-3.5 ${saving
                                            ? "bg-gray-400"
                                            : "bg-[#B8860B]"
                                        }`}
                                >
                                    {saving ? (
                                        <ActivityIndicator
                                            size="small"
                                            color="#ffffff"
                                        />
                                    ) : (
                                        <Ionicons
                                            name="document-text-outline"
                                            size={18}
                                            color="#ffffff"
                                        />
                                    )}

                                    <Text className="ml-2 font-bold text-white">
                                        {saving
                                            ? "Generating..."
                                            : "Generate PDF"}
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}