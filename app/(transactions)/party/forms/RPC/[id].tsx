import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../../../contexts/AuthContext";

const API_BASE = "https://realtorparth.ca/api";

interface TransactionUser {
    id?: string;
    _id?: string;
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
}

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

    if (
        typeof user.userId === "string" &&
        user.userId.trim()
    ) {
        return user.userId;
    }

    return null;
};

type FormData = {
    agreementNumber: string;

    sellerName1: string;
    sellerName2: string;
    buyerName1: string;
    buyerName2: string;

    buyerSignatureEmail1: string;
    buyerSignatureEmail2: string;
    sellerSignatureEmail1: string;
    sellerSignatureEmail2: string;

    buyerWitnessEmail1: string;
    buyerWitnessEmail2: string;
    sellerWitnessEmail1: string;
    sellerWitnessEmail2: string;

    spouseSignatureEmail: string;
    spouseWitnessEmail: string;

    unitnumber: string;
    streetnumber: string;
    streetname: string;
    city: string;
    postalCode: string;

    plan: string;
    block: string;
    lot: string;
    legalOther: string;

    unattachedGoods: string;
    attachedGoods: string;

    purchasePrice: string;
    completionDay: string;

    hidbrokerage: string;

    depositTrustee: string;
    depositAmount1: string;
    depositMethod1: string;
    depositTime1: string;
    depositDate1: string;

    depositAmount2: string;
    depositMethod2: string;
    depositTime2: string;
    depositDate2: string;

    altertime3: string;
    alterdate3: string;

    downPaymentPercent: string;
    financingConditionTime: string;
    financingConditionDay: string;

    inspectionConditionTime: string;
    inspectionConditionDay: string;

    buyerPropertySaleTime: string;
    buyerPropertySaleDay: string;

    buyerConditions: string;
    buyCondTime: string;
    buyCondDate: string;

    sellerConditions: string;
    sellerCondTime: string;
    sellerCondDate: string;

    financingSchedule: boolean;
    tenancySchedule: boolean;
    manufacturedHomeSchedule: boolean;
    saleOfBuyerPropertySchedule: boolean;
    addendum: boolean;

    otherAttachment: string;
    otherTerms: string;

    sellerBrokerage: string;
    sellerRepAddr: string;
    sellerRepCity: string;
    sellerRepState: string;
    sellerRepcode: string;

    brksellerRepName: string;
    brksellerRepPhone: string;
    brksellerRepFax: string;
    brksellerRepEmail: string;

    buyerBrokerage: string;
    buyerRepAddr: string;
    buyerRepCity: string;
    buyerRepState: string;
    buyerRepcode: string;

    brkbuyerRepName: string;
    brkbuyerRepPhone: string;
    brkbuyerRepFax: string;
    brkbuyerRepEmail: string;

    sellerAuthorizedPerson: string;
    buyerAuthorizedPerson: string;

    offerExpiryTime: string;
    offerExpiryDate: string;

    buyerSignedTime1: string;
    buyerSignedDate1: string;
    buyerWitnessName1: string;

    buyerSignedTime2: string;
    buyerSignedDate2: string;
    buyerWitnessName2: string;

    sellerSignedTime1: string;
    sellerSignedDate1: string;
    sellerWitnessName1: string;

    sellerSignedTime2: string;
    sellerSignedDate2: string;
    sellerWitnessName2: string;

    spouseSignedTime: string;
    spouseSignedDate: string;
    spouseName: string;
    spouseWitnessName: string;

    rejectionDateSeller: string;
    rejectionDateBuyer: string;
    rejectionSellerName: string;
    rejectionBuyerName: string;

    sellerRepstreetnum: string;
    sellerRepstreet: string;
    sellerCity: string;
    sellerState: string;
    sellercode: string;
    sellerRepphone: string;
    sellerRepfax: string;

    brksellerRepLName: string;
    brksellerRepLfirm: string;
    brksellerRepLaddr: string;
    brksellerRepLcity: string;
    brksellerRepLstate: string;
    brksellerRepLcode: string;
    brksellerRepLPhone: string;
    brksellerRepLFax: string;
    brksellerRepLEmail: string;

    buyerRepstreetNum: string;
    buyerRepStreet: string;
    buyerRepCity2: string;
    buyerRepState2: string;
    buyerRepcode2: string;
    buyerRepPhone: string;

    brkbuyerRepLName: string;
    brkbuyerRepLFirm: string;
    brkbuyerRepLAddr: string;
    brkbuyerRepLCity: string;
    brkbuyerRepLstate: string;
    brkbuyerRepLZip: string;
    brkbuyerRepLPhone: string;
    brkbuyerRepLFax: string;
    brkbuyerRepLEmail: string;
};

const INITIAL_FORM: FormData = {
    agreementNumber: "",

    sellerName1: "",
    sellerName2: "",
    buyerName1: "",
    buyerName2: "",

    buyerSignatureEmail1: "",
    buyerSignatureEmail2: "",
    sellerSignatureEmail1: "",
    sellerSignatureEmail2: "",

    buyerWitnessEmail1: "",
    buyerWitnessEmail2: "",
    sellerWitnessEmail1: "",
    sellerWitnessEmail2: "",

    spouseSignatureEmail: "",
    spouseWitnessEmail: "",

    unitnumber: "",
    streetnumber: "",
    streetname: "",
    city: "",
    postalCode: "",

    plan: "",
    block: "",
    lot: "",
    legalOther: "",

    unattachedGoods: "",
    attachedGoods: "",

    purchasePrice: "",
    completionDay: "",

    hidbrokerage: "",

    depositTrustee: "",
    depositAmount1: "",
    depositMethod1: "",
    depositTime1: "",
    depositDate1: "",

    depositAmount2: "",
    depositMethod2: "",
    depositTime2: "",
    depositDate2: "",

    altertime3: "",
    alterdate3: "",

    downPaymentPercent: "",
    financingConditionTime: "",
    financingConditionDay: "",

    inspectionConditionTime: "",
    inspectionConditionDay: "",

    buyerPropertySaleTime: "",
    buyerPropertySaleDay: "",

    buyerConditions: "",
    buyCondTime: "",
    buyCondDate: "",

    sellerConditions: "",
    sellerCondTime: "",
    sellerCondDate: "",

    financingSchedule: false,
    tenancySchedule: false,
    manufacturedHomeSchedule: false,
    saleOfBuyerPropertySchedule: false,
    addendum: false,

    otherAttachment: "",
    otherTerms: "",

    sellerBrokerage: "",
    sellerRepAddr: "",
    sellerRepCity: "",
    sellerRepState: "",
    sellerRepcode: "",

    brksellerRepName: "",
    brksellerRepPhone: "",
    brksellerRepFax: "",
    brksellerRepEmail: "",

    buyerBrokerage: "",
    buyerRepAddr: "",
    buyerRepCity: "",
    buyerRepState: "",
    buyerRepcode: "",

    brkbuyerRepName: "",
    brkbuyerRepPhone: "",
    brkbuyerRepFax: "",
    brkbuyerRepEmail: "",

    sellerAuthorizedPerson: "",
    buyerAuthorizedPerson: "",

    offerExpiryTime: "",
    offerExpiryDate: "",

    buyerSignedTime1: "",
    buyerSignedDate1: "",
    buyerWitnessName1: "",

    buyerSignedTime2: "",
    buyerSignedDate2: "",
    buyerWitnessName2: "",

    sellerSignedTime1: "",
    sellerSignedDate1: "",
    sellerWitnessName1: "",

    sellerSignedTime2: "",
    sellerSignedDate2: "",
    sellerWitnessName2: "",

    spouseSignedTime: "",
    spouseSignedDate: "",
    spouseName: "",
    spouseWitnessName: "",

    rejectionDateSeller: "",
    rejectionDateBuyer: "",
    rejectionSellerName: "",
    rejectionBuyerName: "",

    sellerRepstreetnum: "",
    sellerRepstreet: "",
    sellerCity: "",
    sellerState: "",
    sellercode: "",
    sellerRepphone: "",
    sellerRepfax: "",

    brksellerRepLName: "",
    brksellerRepLfirm: "",
    brksellerRepLaddr: "",
    brksellerRepLcity: "",
    brksellerRepLstate: "",
    brksellerRepLcode: "",
    brksellerRepLPhone: "",
    brksellerRepLFax: "",
    brksellerRepLEmail: "",

    buyerRepstreetNum: "",
    buyerRepStreet: "",
    buyerRepCity2: "",
    buyerRepState2: "",
    buyerRepcode2: "",
    buyerRepPhone: "",

    brkbuyerRepLName: "",
    brkbuyerRepLFirm: "",
    brkbuyerRepLAddr: "",
    brkbuyerRepLCity: "",
    brkbuyerRepLstate: "",
    brkbuyerRepLZip: "",
    brkbuyerRepLPhone: "",
    brkbuyerRepLFax: "",
    brkbuyerRepLEmail: "",
};

function parseDate(value?: string) {
    if (!value) return new Date();

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }

    const parts = value.split("/");

    if (parts.length === 3) {
        const month = Number(parts[0]);
        const day = Number(parts[1]);
        const year = Number(parts[2]);

        if (
            !Number.isNaN(month) &&
            !Number.isNaN(day) &&
            !Number.isNaN(year)
        ) {
            return new Date(year, month - 1, day);
        }
    }

    return new Date();
}

function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatTime(date: Date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}

type FieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
    placeholder?: string;
    multiline?: boolean;
    keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
    readOnly?: boolean;
};

function Field({
    label,
    value,
    onChange,
    maxLength,
    placeholder,
    multiline = false,
    keyboardType = "default",
    readOnly = false,
}: FieldProps) {
    return (
        <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-gray-700">
                {label}
            </Text>

            <TextInput
                value={value ?? ""}
                onChangeText={onChange}
                maxLength={maxLength}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                multiline={multiline}
                keyboardType={keyboardType}
                editable={!readOnly}
                textAlignVertical={multiline ? "top" : "center"}
                className={`rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-800 ${
                    multiline ? "min-h-[130px] py-3" : "h-12"
                } ${readOnly ? "bg-gray-100" : ""}`}
            />

            {maxLength ? (
                <Text className="mt-1 text-right text-xs text-gray-400">
                    {value?.length || 0}/{maxLength}
                </Text>
            ) : null}
        </View>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
            <Text className="mb-4 text-lg font-bold text-gray-800">
                {title}
            </Text>

            {children}
        </View>
    );
}

function SubTitle({ children }: { children: React.ReactNode }) {
    return (
        <Text className="mb-3 mt-2 text-base font-semibold text-gray-800">
            {children}
        </Text>
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
                className={`mr-3 h-6 w-6 items-center justify-center rounded-md border ${
                    checked
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300 bg-white"
                }`}
            >
                {checked ? (
                    <Ionicons
                        name="checkmark"
                        size={17}
                        color="#ffffff"
                    />
                ) : null}
            </View>

            <Text className="flex-1 text-sm text-gray-700">
                {label}
            </Text>
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
    const [show, setShow] = useState(false);

    return (
        <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-gray-700">
                {label}
            </Text>

            <Pressable
                onPress={() => setShow(true)}
                className="h-12 flex-row items-center justify-between rounded-xl border border-gray-300 bg-white px-3.5"
            >
                <Text
                    className={
                        value
                            ? "text-sm text-gray-800"
                            : "text-sm text-gray-400"
                    }
                >
                    {value || "Select date"}
                </Text>

                <Ionicons
                    name="calendar-outline"
                    size={19}
                    color="#6b7280"
                />
            </Pressable>

            {show ? (
                <DateTimePicker
                    value={parseDate(value)}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShow(false);

                        if (
                            event.type === "set" &&
                            selectedDate
                        ) {
                            onChange(formatDate(selectedDate));
                        }
                    }}
                />
            ) : null}
        </View>
    );
}

function TimeField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const [show, setShow] = useState(false);

    const parsed = useMemo(() => {
        const date = new Date();

        if (value) {
            const [hours, minutes] = value
                .split(":")
                .map(Number);

            if (
                !Number.isNaN(hours) &&
                !Number.isNaN(minutes)
            ) {
                date.setHours(hours, minutes, 0, 0);
            }
        }

        return date;
    }, [value]);

    return (
        <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-gray-700">
                {label}
            </Text>

            <Pressable
                onPress={() => setShow(true)}
                className="h-12 flex-row items-center justify-between rounded-xl border border-gray-300 bg-white px-3.5"
            >
                <Text
                    className={
                        value
                            ? "text-sm text-gray-800"
                            : "text-sm text-gray-400"
                    }
                >
                    {value || "Select time"}
                </Text>

                <Ionicons
                    name="time-outline"
                    size={19}
                    color="#6b7280"
                />
            </Pressable>

            {show ? (
                <DateTimePicker
                    value={parsed}
                    mode="time"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShow(false);

                        if (
                            event.type === "set" &&
                            selectedDate
                        ) {
                            onChange(
                                formatTime(selectedDate)
                            );
                        }
                    }}
                />
            ) : null}
        </View>
    );
}

export default function RPC() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        id?: string;
        mode?: string;
    }>();

    const id = Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    const mode = Array.isArray(params.mode)
        ? params.mode[0]
        : params.mode;

    const isAdmin = mode === "admin";

    const { user } = useAuth();

    const [checkingTransactionAuth, setCheckingTransactionAuth] =
        useState(isAdmin);

    const [transactionUserId, setTransactionUserId] =
        useState<string | null>(null);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [formData, setFormData] =
        useState<FormData>(INITIAL_FORM);

    const updateField = <K extends keyof FormData>(
        field: K,
        value: FormData[K]
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /*
     * ============================================================
     * ADMIN AUTH BRIDGE
     *
     * Admin Panel -> Admin email -> check-super-admin
     * -> transaction user ID
     * ============================================================
     */
    useEffect(() => {
        let mounted = true;

        async function checkAdminTransactionAccess() {
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

                Alert.alert(
                    "Authentication Required",
                    "Admin session was not found."
                );

                return;
            }

            try {
                setCheckingTransactionAuth(true);

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
                        "You do not have transaction admin access."
                    );
                }

                const transactionUser =
                    data?.user ||
                    data?.transactionUser ||
                    data?.admin ||
                    data;

                const transactionId =
                    getTransactionUserId(
                        transactionUser
                    );

                if (!transactionId) {
                    throw new Error(
                        "Transaction user ID was not returned by the server."
                    );
                }

                if (mounted) {
                    setTransactionUserId(transactionId);
                    setCheckingTransactionAuth(false);
                }
            } catch (error: any) {
                console.error(
                    "Transaction auth bridge error:",
                    error
                );

                if (mounted) {
                    setCheckingTransactionAuth(false);

                    Alert.alert(
                        "Access Denied",
                        error?.message ||
                            "Unable to verify transaction access."
                    );
                }
            }
        }

        checkAdminTransactionAccess();

        return () => {
            mounted = false;
        };
    }, [isAdmin, user?.email]);

    /*
     * ============================================================
     * LOAD SAVED RPC DATA
     * ============================================================
     */
    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        let mounted = true;

        const loadData = async () => {
            try {
                setLoading(true);

                const controller =
                    new AbortController();

                const timeout = setTimeout(
                    () => controller.abort(),
                    15000
                );

                const [
                    partyRes,
                    transactionRes,
                    adminRes,
                    rpcRes,
                ] = await Promise.all([
                    fetch(
                        `${API_BASE}/transactions/parties/transactionParty/settings/${id}`,
                        {
                            signal:
                                controller.signal,
                        }
                    ),
                    fetch(
                        `${API_BASE}/transactions/transaction/settings/${id}`,
                        {
                            signal:
                                controller.signal,
                        }
                    ),
                    fetch(
                        `${API_BASE}/admin/settings/by-party/${id}`,
                        {
                            signal:
                                controller.signal,
                        }
                    ),
                    fetch(
                        `${API_BASE}/rpcpdf/rpc/user/${id}`,
                        {
                            signal:
                                controller.signal,
                        }
                    ),
                ]);

                clearTimeout(timeout);

                const parseJSON = async (
                    response: Response
                ) => {
                    try {
                        return await response.json();
                    } catch {
                        throw new Error(
                            "Invalid server response"
                        );
                    }
                };

                const [
                    partyJson,
                    transactionJson,
                    adminJson,
                    rpcJson,
                ] = await Promise.all([
                    parseJSON(partyRes),
                    parseJSON(transactionRes),
                    parseJSON(adminRes),
                    parseJSON(rpcRes),
                ]);

                if (
                    !partyRes.ok ||
                    !transactionRes.ok ||
                    !adminRes.ok ||
                    !rpcRes.ok
                ) {
                    throw new Error(
                        "Failed to load data"
                    );
                }

                const partysettings =
                    partyJson?.data || {};

                const transactionsettings =
                    transactionJson?.data || {};

                const settings =
                    adminJson?.data || {};

                const cleanData =
                    rpcJson?.data || {};

                const passport =
                    partysettings?.identityData
                        ?.passport?.fullName
                        ? partysettings.identityData
                              .passport
                        : null;

                const license =
                    partysettings?.identityData
                        ?.license?.fullName
                        ? partysettings.identityData
                              .license
                        : null;

                const buyerFullName =
                    passport?.fullName ||
                    license?.fullName ||
                    partysettings?.name ||
                    "";

                const pick = (
                    ...values: any[]
                ) =>
                    values.find(
                        (value) =>
                            value !==
                                undefined &&
                            value !== null &&
                            value !== ""
                    );

                if (mounted) {
                    setFormData((prev) => ({
                        ...prev,

                        buyerName1: pick(
                            cleanData?.buyerName1,
                            prev.buyerName1,
                            buyerFullName,
                            ""
                        ),

                        buyerSignatureEmail1: pick(
                            cleanData?.buyerSignatureEmail1,
                            prev.buyerSignatureEmail1,
                            partysettings?.email,
                            ""
                        ),

                        agreementNumber: pick(
                            cleanData?.agreementNumber,
                            prev.agreementNumber,
                            transactionsettings?.agreementnumber,
                            ""
                        ),

                        sellerBrokerage: pick(
                            cleanData?.sellerBrokerage,
                            prev.sellerBrokerage,
                            settings?.brokerageName,
                            ""
                        ),

                        buyerBrokerage: pick(
                            cleanData?.buyerBrokerage,
                            prev.buyerBrokerage,
                            settings?.brokerageName,
                            ""
                        ),

                        brksellerRepName: pick(
                            cleanData?.brksellerRepName,
                            prev.brksellerRepName,
                            settings?.repName,
                            ""
                        ),

                        brkbuyerRepName: pick(
                            cleanData?.brkbuyerRepName,
                            prev.brkbuyerRepName,
                            settings?.repName,
                            ""
                        ),

                        sellerRepAddr: pick(
                            cleanData?.sellerRepAddr,
                            prev.sellerRepAddr,
                            `${settings?.brokerageStreetNum || ""} ${
                                settings?.brokerageStreet || ""
                            }`.trim(),
                            ""
                        ),

                        sellerRepCity: pick(
                            cleanData?.sellerRepCity,
                            prev.sellerRepCity,
                            settings?.brokerageCity,
                            ""
                        ),

                        sellerRepState: pick(
                            cleanData?.sellerRepState,
                            prev.sellerRepState,
                            settings?.brokerageState,
                            ""
                        ),

                        sellerRepcode: pick(
                            cleanData?.sellerRepcode,
                            prev.sellerRepcode,
                            settings?.brokeragePostalCode,
                            ""
                        ),

                        buyerRepAddr: pick(
                            cleanData?.buyerRepAddr,
                            prev.buyerRepAddr,
                            `${settings?.brokerageStreetNum || ""} ${
                                settings?.brokerageStreet || ""
                            }`.trim(),
                            ""
                        ),

                        buyerRepCity: pick(
                            cleanData?.buyerRepCity,
                            prev.buyerRepCity,
                            settings?.brokerageCity,
                            ""
                        ),

                        buyerRepState: pick(
                            cleanData?.buyerRepState,
                            prev.buyerRepState,
                            settings?.brokerageState,
                            ""
                        ),

                        buyerRepcode: pick(
                            cleanData?.buyerRepcode,
                            prev.buyerRepcode,
                            settings?.brokeragePostalCode,
                            ""
                        ),

                        brksellerRepPhone: pick(
                            cleanData?.brksellerRepPhone,
                            prev.brksellerRepPhone,
                            settings?.repPhone,
                            ""
                        ),

                        brksellerRepEmail: pick(
                            cleanData?.brksellerRepEmail,
                            prev.brksellerRepEmail,
                            settings?.repEmail,
                            ""
                        ),

                        brkbuyerRepPhone: pick(
                            cleanData?.brkbuyerRepPhone,
                            prev.brkbuyerRepPhone,
                            settings?.repPhone,
                            ""
                        ),

                        brkbuyerRepEmail: pick(
                            cleanData?.brkbuyerRepEmail,
                            prev.brkbuyerRepEmail,
                            settings?.repEmail,
                            ""
                        ),

                        buyerSignatureEmail2: pick(
                            cleanData?.buyerSignatureEmail2,
                            prev.buyerSignatureEmail2,
                            ""
                        ),

                        sellerSignatureEmail1: pick(
                            cleanData?.sellerSignatureEmail1,
                            prev.sellerSignatureEmail1,
                            ""
                        ),

                        sellerSignatureEmail2: pick(
                            cleanData?.sellerSignatureEmail2,
                            prev.sellerSignatureEmail2,
                            ""
                        ),

                        buyerWitnessEmail1: pick(
                            cleanData?.buyerWitnessEmail1,
                            prev.buyerWitnessEmail1,
                            ""
                        ),

                        buyerWitnessEmail2: pick(
                            cleanData?.buyerWitnessEmail2,
                            prev.buyerWitnessEmail2,
                            ""
                        ),

                        sellerWitnessEmail1: pick(
                            cleanData?.sellerWitnessEmail1,
                            prev.sellerWitnessEmail1,
                            ""
                        ),

                        sellerWitnessEmail2: pick(
                            cleanData?.sellerWitnessEmail2,
                            prev.sellerWitnessEmail2,
                            ""
                        ),

                        spouseSignatureEmail: pick(
                            cleanData?.spouseSignatureEmail,
                            prev.spouseSignatureEmail,
                            ""
                        ),

                        spouseWitnessEmail: pick(
                            cleanData?.spouseWitnessEmail,
                            prev.spouseWitnessEmail,
                            ""
                        ),

                        ...cleanData,
                    }));
                }
            } catch (error: any) {
                console.error(
                    "RPC LOAD ERROR:",
                    error
                );

                if (!mounted) return;

                if (
                    error?.name ===
                    "AbortError"
                ) {
                    Alert.alert(
                        "Timeout",
                        "Request timed out."
                    );
                } else if (
                    error?.name ===
                    "TypeError"
                ) {
                    Alert.alert(
                        "Network Error",
                        "Server down or network error."
                    );
                } else {
                    Alert.alert(
                        "Error",
                        error?.message ||
                            "Failed to load RPC data."
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, [id]);

    /*
     * ============================================================
     * SUBMIT
     * ============================================================
     */
    const handleSubmit = async () => {
        if (!id) {
            Alert.alert(
                "Error",
                "Party not found."
            );
            return;
        }

        if (isAdmin && !transactionUserId) {
            Alert.alert(
                "Error",
                "Transaction admin access has not been verified."
            );
            return;
        }

        try {
            setSaving(true);

            const payload = {
                ...formData,
                partyId: id,
                sendEmail: false,
                isAdmin,
            };

            const controller =
                new AbortController();

            const timeout = setTimeout(
                () => controller.abort(),
                20000
            );

            const response = await fetch(
                `${API_BASE}/rpcpdf/generate-rpc`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(payload),
                    signal:
                        controller.signal,
                }
            );

            clearTimeout(timeout);

            if (!response.ok) {
                let message =
                    "Request failed";

                try {
                    const errorData =
                        await response.json();

                    message =
                        errorData?.message ||
                        errorData?.error ||
                        message;
                } catch {
                    // Keep default message.
                }

                throw new Error(message);
            }

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            /*
             * Admin website receives PDF.
             *
             * Mobile cannot use window.URL.createObjectURL.
             * We consume the response so the backend request
             * completes successfully.
             */
            if (
                contentType.includes(
                    "application/pdf"
                )
            ) {
                await response.arrayBuffer();

                Alert.alert(
                    "Success",
                    "RPC updated successfully."
                );

                return;
            }

            try {
                await response.json();
            } catch {
                // Some successful APIs may return empty response.
            }

            Alert.alert(
                "Success",
                "Residential Purchase Contract saved successfully."
            );
        } catch (error: any) {
            console.error(
                "RPC SUBMIT ERROR:",
                error
            );

            if (
                error?.name ===
                "AbortError"
            ) {
                Alert.alert(
                    "Timeout",
                    "Request timed out."
                );
            } else if (
                error?.name ===
                "TypeError"
            ) {
                Alert.alert(
                    "Network Error",
                    "Server down or network error."
                );
            } else {
                Alert.alert(
                    "Error",
                    error?.message ||
                        "Error processing request."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    if (isAdmin && checkingTransactionAuth) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <ActivityIndicator
                    size="large"
                    color="#2563eb"
                />

                <Text className="mt-4 text-center text-sm text-gray-500">
                    Checking transaction authentication...
                </Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <ActivityIndicator
                    size="large"
                    color="#2563eb"
                />

                <Text className="mt-4 text-sm text-gray-500">
                    Loading Residential Purchase Contract...
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 50,
                }}
            >

                <View className="mb-5">
                    <Text className="text-center text-2xl font-bold text-gray-900">
                        RESIDENTIAL PURCHASE CONTRACT
                    </Text>
                </View>

                {/* {isAdmin ? (
                    <View className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
                        <Text className="text-sm font-medium text-blue-700">
                            Admin Mode – You can edit but not
                            change workflow
                        </Text>
                    </View>
                ) : null} */}

                {/* =====================================================
                    SELLER
                ====================================================== */}
                <Section
                    title="THE SELLER (Person(s) who own the property and are selling it)"
                >
                    <Field
                        label="Full Legal Name of Seller"
                        value={formData.sellerName1}
                        maxLength={80}
                        onChange={(value) =>
                            updateField(
                                "sellerName1",
                                value
                            )
                        }
                    />

                    <Field
                        label="Full Legal Name of Additional Seller (if applicable)"
                        value={formData.sellerName2}
                        maxLength={80}
                        onChange={(value) =>
                            updateField(
                                "sellerName2",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    BUYER
                ====================================================== */}
                <Section
                    title="THE BUYER (Person(s) purchasing the property)"
                >
                    <Field
                        label="Full Legal Name of Buyer"
                        value={formData.buyerName1}
                        maxLength={80}
                        onChange={(value) =>
                            updateField(
                                "buyerName1",
                                value
                            )
                        }
                    />

                    <Field
                        label="Full Legal Name of Additional Buyer (if applicable)"
                        value={formData.buyerName2}
                        maxLength={80}
                        onChange={(value) =>
                            updateField(
                                "buyerName2",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    PROPERTY
                ====================================================== */}
                <Section title="1. THE PROPERTY">
                    <Text className="mb-4 text-sm leading-5 text-gray-600">
                        Description of the property being purchased.
                    </Text>

                    <Text className="mb-3 text-sm font-semibold text-gray-800">
                        Municipal Address – Street Number and Street Name
                    </Text>

                    <Field
                        label="Unit Number"
                        value={formData.unitnumber}
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "unitnumber",
                                value
                            )
                        }
                    />

                    <Field
                        label="Street Number"
                        value={formData.streetnumber}
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "streetnumber",
                                value
                            )
                        }
                    />

                    <Field
                        label="Street Name"
                        value={formData.streetname}
                        maxLength={60}
                        onChange={(value) =>
                            updateField(
                                "streetname",
                                value
                            )
                        }
                    />

                    <Field
                        label="City"
                        value={formData.city}
                        maxLength={40}
                        onChange={(value) =>
                            updateField(
                                "city",
                                value
                            )
                        }
                    />

                    <Field
                        label="Postal Code"
                        value={formData.postalCode}
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "postalCode",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    LEGAL DESCRIPTION
                ====================================================== */}
                <Section title="Legal Description of the Property">
                    <Field
                        label="Plan"
                        value={formData.plan}
                        maxLength={40}
                        placeholder="Registered Land Plan Number"
                        onChange={(value) =>
                            updateField(
                                "plan",
                                value
                            )
                        }
                    />

                    <Field
                        label="Block"
                        value={formData.block}
                        maxLength={40}
                        placeholder="Registered Land Block Number"
                        onChange={(value) =>
                            updateField(
                                "block",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lot"
                        value={formData.lot}
                        maxLength={20}
                        placeholder="Registered Land Lot Number"
                        onChange={(value) =>
                            updateField(
                                "lot",
                                value
                            )
                        }
                    />

                    <Field
                        label="Legal Other"
                        value={formData.legalOther}
                        maxLength={40}
                        placeholder="Other Legal Description Information"
                        onChange={(value) =>
                            updateField(
                                "legalOther",
                                value
                            )
                        }
                    />

                    <Field
                        label="Unattached Goods"
                        value={
                            formData.unattachedGoods
                        }
                        maxLength={500}
                        placeholder="Unattached Goods Included"
                        multiline
                        onChange={(value) =>
                            updateField(
                                "unattachedGoods",
                                value
                            )
                        }
                    />

                    <Field
                        label="Attached Goods"
                        value={
                            formData.attachedGoods
                        }
                        maxLength={300}
                        placeholder="Attached Goods Included"
                        multiline
                        onChange={(value) =>
                            updateField(
                                "attachedGoods",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    PURCHASE PRICE
                ====================================================== */}
                <Section title="2. PURCHASE PRICE AND COMPLETION DAY">
                    <Field
                        label="Purchase Price"
                        value={
                            formData.purchasePrice
                        }
                        maxLength={100}
                        placeholder="Purchase Price"
                        onChange={(value) =>
                            updateField(
                                "purchasePrice",
                                value
                            )
                        }
                    />

                    <DateField
                        label="Completion Day"
                        value={
                            formData.completionDay
                        }
                        onChange={(value) =>
                            updateField(
                                "completionDay",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    GENERAL TERMS
                ====================================================== */}
                <Section title="3. GENERAL TERMS">
                    <Text className="mb-4 text-sm leading-6 text-gray-600">
                        The brokerage will provide this contract and
                        related documents (seller's or buyer's) to the
                        appointed lawyers for the purpose of closing
                        this contract.
                    </Text>

                    <Field
                        label="Brokerage"
                        value={
                            formData.hidbrokerage
                        }
                        maxLength={20}
                        onChange={(value) =>
                            updateField(
                                "hidbrokerage",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    DEPOSITS
                ====================================================== */}
                <Section title="4. DEPOSITS">
                    <Field
                        label="Deposit Trustee"
                        value={
                            formData.depositTrustee
                        }
                        maxLength={80}
                        placeholder="Name of the Brokerage or Party Holding the Deposit as Trustee"
                        onChange={(value) =>
                            updateField(
                                "depositTrustee",
                                value
                            )
                        }
                    />

                    <SubTitle>
                        Initial Deposit Payment
                    </SubTitle>

                    <Field
                        label="Deposit Amount"
                        value={
                            formData.depositAmount1
                        }
                        maxLength={16}
                        placeholder="Amount Paid by the Buyer"
                        onChange={(value) =>
                            updateField(
                                "depositAmount1",
                                value
                            )
                        }
                    />

                    <Field
                        label="Deposit Method"
                        value={
                            formData.depositMethod1
                        }
                        maxLength={80}
                        placeholder="Method of Payment"
                        onChange={(value) =>
                            updateField(
                                "depositMethod1",
                                value
                            )
                        }
                    />

                    <TimeField
                        label="Deposit Time"
                        value={
                            formData.depositTime1
                        }
                        onChange={(value) =>
                            updateField(
                                "depositTime1",
                                value
                            )
                        }
                    />

                    <DateField
                        label="Deposit Date"
                        value={
                            formData.depositDate1
                        }
                        onChange={(value) =>
                            updateField(
                                "depositDate1",
                                value
                            )
                        }
                    />

                    <SubTitle>
                        Additional Deposit Payment
                    </SubTitle>

                    <Field
                        label="Deposit Amount"
                        value={
                            formData.depositAmount2
                        }
                        maxLength={16}
                        placeholder="Amount"
                        onChange={(value) =>
                            updateField(
                                "depositAmount2",
                                value
                            )
                        }
                    />

                    <Field
                        label="Deposit Method"
                        value={
                            formData.depositMethod2
                        }
                        maxLength={80}
                        placeholder="Method of Payment"
                        onChange={(value) =>
                            updateField(
                                "depositMethod2",
                                value
                            )
                        }
                    />

                    <TimeField
                        label="Deposit Time"
                        value={
                            formData.depositTime2
                        }
                        onChange={(value) =>
                            updateField(
                                "depositTime2",
                                value
                            )
                        }
                    />

                    <DateField
                        label="Deposit Date"
                        value={
                            formData.depositDate2
                        }
                        onChange={(value) =>
                            updateField(
                                "depositDate2",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    DOWER
                ====================================================== */}
                <Section title="7. DOWER">
                    <Text className="mb-4 text-sm leading-6 text-gray-600">
                        Provide a completed Dower Consent and
                        Acknowledgement form part of this contract on
                        or before.
                    </Text>

                    <TimeField
                        label="Time"
                        value={
                            formData.altertime3
                        }
                        onChange={(value) =>
                            updateField(
                                "altertime3",
                                value
                            )
                        }
                    />

                    <DateField
                        label="Date"
                        value={
                            formData.alterdate3
                        }
                        onChange={(value) =>
                            updateField(
                                "alterdate3",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    CONDITIONS
                ====================================================== */}
                <Section title="8. CONDITIONS">
                    <Field
                        label="Required Down Payment %"
                        value={
                            formData.downPaymentPercent
                        }
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "downPaymentPercent",
                                value
                            )
                        }
                    />

                    <TimeField
                        label="Financing Time"
                        value={
                            formData.financingConditionTime
                        }
                        onChange={(value) =>
                            updateField(
                                "financingConditionTime",
                                value
                            )
                        }
                    />

                    <DateField
                        label="Financing Date"
                        value={
                            formData.financingConditionDay
                        }
                        onChange={(value) =>
                            updateField(
                                "financingConditionDay",
                                value
                            )
                        }
                    />

                    <TimeField
                        label="Inspection Time"
                        value={
                            formData.inspectionConditionTime
                        }
                        onChange={(value) =>
                            updateField(
                                "inspectionConditionTime",
                                value
                            )
                        }
                    />

                    <DateField
                        label="Inspection Date"
                        value={
                            formData.inspectionConditionDay
                        }
                        onChange={(value) =>
                            updateField(
                                "inspectionConditionDay",
                                value
                            )
                        }
                    />

                    <TimeField
                        label="Buyer Property Sale Time"
                        value={
                            formData.buyerPropertySaleTime
                        }
                        onChange={(value) =>
                            updateField(
                                "buyerPropertySaleTime",
                                value
                            )
                        }
                    />

                    <DateField
                        label="Buyer Property Sale Date"
                        value={
                            formData.buyerPropertySaleDay
                        }
                        onChange={(value) =>
                            updateField(
                                "buyerPropertySaleDay",
                                value
                            )
                        }
                    />

                    <Field
                        label="Additional Buyer Conditions"
                        value={
                            formData.buyerConditions
                        }
                        maxLength={1000}
                        multiline
                        onChange={(value) =>
                            updateField(
                                "buyerConditions",
                                value
                            )
                        }
                    />

                    <Text className="mb-3 mt-2 text-sm font-semibold text-gray-800">
                        Buyer Deadline Time & Date
                    </Text>

                    <TimeField
                        label="Time"
                        value={
                            formData.buyCondTime
                        }
                        onChange={(value) =>
                            updateField(
                                "buyCondTime",
                                value
                            )
                        }
                    />

                    <DateField
                        label="Date"
                        value={
                            formData.buyCondDate
                        }
                        onChange={(value) =>
                            updateField(
                                "buyCondDate",
                                value
                            )
                        }
                    />

                    <Field
                        label="Seller Conditions"
                        value={
                            formData.sellerConditions
                        }
                        maxLength={1000}
                        multiline
                        onChange={(value) =>
                            updateField(
                                "sellerConditions",
                                value
                            )
                        }
                    />

                    <Text className="mb-3 mt-2 text-sm font-semibold text-gray-800">
                        Seller Deadline Time & Date
                    </Text>

                    <TimeField
                        label="Time"
                        value={
                            formData.sellerCondTime
                        }
                        onChange={(value) =>
                            updateField(
                                "sellerCondTime",
                                value
                            )
                        }
                    />

                    <DateField
                        label="Date"
                        value={
                            formData.sellerCondDate
                        }
                        onChange={(value) =>
                            updateField(
                                "sellerCondDate",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    ATTACHMENTS
                ====================================================== */}
                <Section title="9. ATTACHMENTS">
                    <Checkbox
                        label="Financing Schedule"
                        checked={
                            formData.financingSchedule
                        }
                        onPress={() =>
                            updateField(
                                "financingSchedule",
                                !formData.financingSchedule
                            )
                        }
                    />

                    <Checkbox
                        label="Tenancy Schedule"
                        checked={
                            formData.tenancySchedule
                        }
                        onPress={() =>
                            updateField(
                                "tenancySchedule",
                                !formData.tenancySchedule
                            )
                        }
                    />

                    <Checkbox
                        label="Manufactured Home"
                        checked={
                            formData.manufacturedHomeSchedule
                        }
                        onPress={() =>
                            updateField(
                                "manufacturedHomeSchedule",
                                !formData.manufacturedHomeSchedule
                            )
                        }
                    />

                    <Checkbox
                        label="Sale of Buyer Property"
                        checked={
                            formData.saleOfBuyerPropertySchedule
                        }
                        onPress={() =>
                            updateField(
                                "saleOfBuyerPropertySchedule",
                                !formData.saleOfBuyerPropertySchedule
                            )
                        }
                    />

                    <Checkbox
                        label="Addendum"
                        checked={formData.addendum}
                        onPress={() =>
                            updateField(
                                "addendum",
                                !formData.addendum
                            )
                        }
                    />

                    <Field
                        label="Other Attachments"
                        value={
                            formData.otherAttachment
                        }
                        maxLength={80}
                        onChange={(value) =>
                            updateField(
                                "otherAttachment",
                                value
                            )
                        }
                    />

                    <Field
                        label="Other Additional Terms"
                        value={
                            formData.otherTerms
                        }
                        maxLength={700}
                        multiline
                        onChange={(value) =>
                            updateField(
                                "otherTerms",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    AUTHORIZATION
                ====================================================== */}
                <Section title="14. AUTHORIZATION">
                    <SubTitle>
                        Seller Brokerage
                    </SubTitle>

                    <Field
                        label="Seller Brokerage Name"
                        value={
                            formData.sellerBrokerage
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "sellerBrokerage",
                                value
                            )
                        }
                    />

                    <Field
                        label="Address"
                        value={
                            formData.sellerRepAddr
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "sellerRepAddr",
                                value
                            )
                        }
                    />

                    <Field
                        label="City"
                        value={
                            formData.sellerRepCity
                        }
                        maxLength={40}
                        onChange={(value) =>
                            updateField(
                                "sellerRepCity",
                                value
                            )
                        }
                    />

                    <Field
                        label="State"
                        value={
                            formData.sellerRepState
                        }
                        maxLength={2}
                        onChange={(value) =>
                            updateField(
                                "sellerRepState",
                                value
                            )
                        }
                    />

                    <Field
                        label="Zip Code"
                        value={
                            formData.sellerRepcode
                        }
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "sellerRepcode",
                                value
                            )
                        }
                    />

                    <SubTitle>
                        Seller Brokerage Representative
                    </SubTitle>

                    <Field
                        label="Representative Name"
                        value={
                            formData.brksellerRepName
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "brksellerRepName",
                                value
                            )
                        }
                    />

                    <Field
                        label="Phone"
                        value={
                            formData.brksellerRepPhone
                        }
                        maxLength={20}
                        keyboardType="phone-pad"
                        onChange={(value) =>
                            updateField(
                                "brksellerRepPhone",
                                value
                            )
                        }
                    />

                    <Field
                        label="Fax"
                        value={
                            "---------------------"
                        }
                        maxLength={20}
                        readOnly
                        onChange={() => {}}
                    />

                    <Field
                        label="Email"
                        value={
                            formData.brksellerRepEmail
                        }
                        maxLength={80}
                        keyboardType="email-address"
                        onChange={(value) =>
                            updateField(
                                "brksellerRepEmail",
                                value
                            )
                        }
                    />

                    <SubTitle>
                        Buyer Brokerage
                    </SubTitle>

                    <Field
                        label="Buyer Brokerage Name"
                        value={
                            formData.buyerBrokerage
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "buyerBrokerage",
                                value
                            )
                        }
                    />

                    <Field
                        label="Address"
                        value={
                            formData.buyerRepAddr
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "buyerRepAddr",
                                value
                            )
                        }
                    />

                    <Field
                        label="City"
                        value={
                            formData.buyerRepCity
                        }
                        maxLength={40}
                        onChange={(value) =>
                            updateField(
                                "buyerRepCity",
                                value
                            )
                        }
                    />

                    <Field
                        label="State"
                        value={
                            formData.buyerRepState
                        }
                        maxLength={2}
                        onChange={(value) =>
                            updateField(
                                "buyerRepState",
                                value
                            )
                        }
                    />

                    <Field
                        label="Zip Code"
                        value={
                            formData.buyerRepcode
                        }
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "buyerRepcode",
                                value
                            )
                        }
                    />

                    <SubTitle>
                        Buyer Brokerage Representative
                    </SubTitle>

                    <Field
                        label="Representative Name"
                        value={
                            formData.brkbuyerRepName
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepName",
                                value
                            )
                        }
                    />

                    <Field
                        label="Phone"
                        value={
                            formData.brkbuyerRepPhone
                        }
                        maxLength={20}
                        keyboardType="phone-pad"
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepPhone",
                                value
                            )
                        }
                    />

                    <Field
                        label="Fax"
                        value={
                            "----------------------"
                        }
                        maxLength={20}
                        readOnly
                        onChange={() => {}}
                    />

                    <Field
                        label="Email"
                        value={
                            formData.brkbuyerRepEmail
                        }
                        maxLength={80}
                        keyboardType="email-address"
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepEmail",
                                value
                            )
                        }
                    />

                    <Field
                        label="If no brokerage is authorized, enter the Seller's Authorized Representative"
                        value={
                            formData.sellerAuthorizedPerson
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "sellerAuthorizedPerson",
                                value
                            )
                        }
                    />

                    <Field
                        label="If no brokerage is authorized, enter the Buyer's Authorized Representative"
                        value={
                            formData.buyerAuthorizedPerson
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "buyerAuthorizedPerson",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    OFFER
                ====================================================== */}
                <Section title="17. OFFER">
                    <Text className="mb-3 text-sm font-semibold text-gray-800">
                        Offer Expiry Time & Date
                    </Text>

                    <TimeField
                        label="Expiry Time"
                        value={
                            formData.offerExpiryTime
                        }
                        onChange={(value) =>
                            updateField(
                                "offerExpiryTime",
                                value
                            )
                        }
                    />

                    <DateField
                        label="Expiry Date"
                        value={
                            formData.offerExpiryDate
                        }
                        onChange={(value) =>
                            updateField(
                                "offerExpiryDate",
                                value
                            )
                        }
                    />

                    <SubTitle>
                        Buyer 1
                    </SubTitle>

                    <Field
                        label="Buyer Name"
                        value={
                            formData.buyerName1
                        }
                        readOnly
                        onChange={() => {}}
                    />

                    <Field
                        label="Buyer Email"
                        value={
                            formData.buyerSignatureEmail1
                        }
                        keyboardType="email-address"
                        onChange={(value) =>
                            updateField(
                                "buyerSignatureEmail1",
                                value
                            )
                        }
                    />

                    <Field
                        label="Buyer 1 Witness Name"
                        value={
                            formData.buyerWitnessName1
                        }
                        maxLength={80}
                        onChange={(value) =>
                            updateField(
                                "buyerWitnessName1",
                                value
                            )
                        }
                    />

                    {formData.buyerWitnessName1 ? (
                        <Field
                            label="Buyer Witness Email"
                            value={
                                formData.buyerWitnessEmail1
                            }
                            keyboardType="email-address"
                            onChange={(value) =>
                                updateField(
                                    "buyerWitnessEmail1",
                                    value
                                )
                            }
                        />
                    ) : null}

                    {formData.buyerName2 ? (
                        <>
                            <SubTitle>
                                Buyer 2
                            </SubTitle>

                            <Field
                                label="Buyer Name"
                                value={
                                    formData.buyerName2
                                }
                                readOnly
                                onChange={() => {}}
                            />

                            <Field
                                label="Buyer Email"
                                value={
                                    formData.buyerSignatureEmail2
                                }
                                keyboardType="email-address"
                                onChange={(value) =>
                                    updateField(
                                        "buyerSignatureEmail2",
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Buyer 2 Witness Name"
                                value={
                                    formData.buyerWitnessName2
                                }
                                maxLength={80}
                                onChange={(value) =>
                                    updateField(
                                        "buyerWitnessName2",
                                        value
                                    )
                                }
                            />

                            {formData.buyerWitnessName2 ? (
                                <Field
                                    label="Buyer Witness Email"
                                    value={
                                        formData.buyerWitnessEmail2
                                    }
                                    keyboardType="email-address"
                                    onChange={(value) =>
                                        updateField(
                                            "buyerWitnessEmail2",
                                            value
                                        )
                                    }
                                />
                            ) : null}
                        </>
                    ) : null}
                </Section>

                {/* =====================================================
                    ACCEPTANCE
                ====================================================== */}
                <Section title="18. ACCEPTANCE">
                    <SubTitle>
                        Seller 1
                    </SubTitle>

                    <Field
                        label="Seller Name"
                        value={
                            formData.sellerName1
                        }
                        readOnly
                        onChange={() => {}}
                    />

                    <Field
                        label="Seller Email"
                        value={
                            formData.sellerSignatureEmail1
                        }
                        keyboardType="email-address"
                        onChange={(value) =>
                            updateField(
                                "sellerSignatureEmail1",
                                value
                            )
                        }
                    />

                    <Field
                        label="Seller 1 Witness Name"
                        value={
                            formData.sellerWitnessName1
                        }
                        maxLength={80}
                        onChange={(value) =>
                            updateField(
                                "sellerWitnessName1",
                                value
                            )
                        }
                    />

                    {formData.sellerWitnessName1 ? (
                        <Field
                            label="Seller Witness Email"
                            value={
                                formData.sellerWitnessEmail1
                            }
                            keyboardType="email-address"
                            onChange={(value) =>
                                updateField(
                                    "sellerWitnessEmail1",
                                    value
                                )
                            }
                        />
                    ) : null}

                    {formData.sellerName2 ? (
                        <>
                            <SubTitle>
                                Seller 2
                            </SubTitle>

                            <Field
                                label="Seller Name"
                                value={
                                    formData.sellerName2
                                }
                                readOnly
                                onChange={() => {}}
                            />

                            <Field
                                label="Seller Email"
                                value={
                                    formData.sellerSignatureEmail2
                                }
                                keyboardType="email-address"
                                onChange={(value) =>
                                    updateField(
                                        "sellerSignatureEmail2",
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Seller 2 Witness Name"
                                value={
                                    formData.sellerWitnessName2
                                }
                                maxLength={80}
                                onChange={(value) =>
                                    updateField(
                                        "sellerWitnessName2",
                                        value
                                    )
                                }
                            />

                            {formData.sellerWitnessName2 ? (
                                <Field
                                    label="Seller Witness Email"
                                    value={
                                        formData.sellerWitnessEmail2
                                    }
                                    keyboardType="email-address"
                                    onChange={(value) =>
                                        updateField(
                                            "sellerWitnessEmail2",
                                            value
                                        )
                                    }
                                />
                            ) : null}
                        </>
                    ) : null}
                </Section>

                {/* =====================================================
                    SPOUSE
                ====================================================== */}
                <Section title="Non-Owner Spouse Signature">
                    <Field
                        label="Spouse Name"
                        value={
                            formData.spouseName
                        }
                        maxLength={80}
                        onChange={(value) =>
                            updateField(
                                "spouseName",
                                value
                            )
                        }
                    />

                    {formData.spouseName ? (
                        <Field
                            label="Spouse Email"
                            value={
                                formData.spouseSignatureEmail
                            }
                            keyboardType="email-address"
                            onChange={(value) =>
                                updateField(
                                    "spouseSignatureEmail",
                                    value
                                )
                            }
                        />
                    ) : null}

                    <Field
                        label="Spouse Witness Name"
                        value={
                            formData.spouseWitnessName
                        }
                        maxLength={80}
                        onChange={(value) =>
                            updateField(
                                "spouseWitnessName",
                                value
                            )
                        }
                    />

                    {formData.spouseWitnessName ? (
                        <Field
                            label="Spouse Witness Email"
                            value={
                                formData.spouseWitnessEmail
                            }
                            keyboardType="email-address"
                            onChange={(value) =>
                                updateField(
                                    "spouseWitnessEmail",
                                    value
                                )
                            }
                        />
                    ) : null}
                </Section>

                {/* =====================================================
                    CONVEYANCING
                ====================================================== */}
                <Section title="CONVEYANCING INFORMATION">
                    <SubTitle>
                        Seller Info
                    </SubTitle>

                    <Field
                        label="Street Number"
                        value={
                            formData.sellerRepstreetnum
                        }
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "sellerRepstreetnum",
                                value
                            )
                        }
                    />

                    <Field
                        label="Street"
                        value={
                            formData.sellerRepstreet
                        }
                        maxLength={60}
                        onChange={(value) =>
                            updateField(
                                "sellerRepstreet",
                                value
                            )
                        }
                    />

                    <Field
                        label="City"
                        value={
                            formData.sellerCity
                        }
                        maxLength={40}
                        onChange={(value) =>
                            updateField(
                                "sellerCity",
                                value
                            )
                        }
                    />

                    <Field
                        label="State"
                        value={
                            formData.sellerState
                        }
                        maxLength={2}
                        onChange={(value) =>
                            updateField(
                                "sellerState",
                                value
                            )
                        }
                    />

                    <Field
                        label="Zip Code"
                        value={
                            formData.sellercode
                        }
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "sellercode",
                                value
                            )
                        }
                    />

                    <Field
                        label="Phone"
                        value={
                            formData.sellerRepphone
                        }
                        maxLength={20}
                        keyboardType="phone-pad"
                        onChange={(value) =>
                            updateField(
                                "sellerRepphone",
                                value
                            )
                        }
                    />

                    <Field
                        label="Fax"
                        value={
                            formData.sellerRepfax
                        }
                        maxLength={20}
                        onChange={(value) =>
                            updateField(
                                "sellerRepfax",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Name"
                        value={
                            formData.brksellerRepLName
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "brksellerRepLName",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Firm"
                        value={
                            formData.brksellerRepLfirm
                        }
                        maxLength={80}
                        onChange={(value) =>
                            updateField(
                                "brksellerRepLfirm",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Address"
                        value={
                            formData.brksellerRepLaddr
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "brksellerRepLaddr",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer City"
                        value={
                            formData.brksellerRepLcity
                        }
                        maxLength={40}
                        onChange={(value) =>
                            updateField(
                                "brksellerRepLcity",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer State"
                        value={
                            formData.brksellerRepLstate
                        }
                        maxLength={2}
                        onChange={(value) =>
                            updateField(
                                "brksellerRepLstate",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Zip Code"
                        value={
                            formData.brksellerRepLcode
                        }
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "brksellerRepLcode",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Phone"
                        value={
                            formData.brksellerRepLPhone
                        }
                        maxLength={20}
                        keyboardType="phone-pad"
                        onChange={(value) =>
                            updateField(
                                "brksellerRepLPhone",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Fax"
                        value={
                            formData.brksellerRepLFax
                        }
                        maxLength={20}
                        onChange={(value) =>
                            updateField(
                                "brksellerRepLFax",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Email"
                        value={
                            formData.brksellerRepLEmail
                        }
                        maxLength={80}
                        keyboardType="email-address"
                        onChange={(value) =>
                            updateField(
                                "brksellerRepLEmail",
                                value
                            )
                        }
                    />

                    <SubTitle>
                        Buyer Info
                    </SubTitle>

                    <Field
                        label="Street Number"
                        value={
                            formData.buyerRepstreetNum
                        }
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "buyerRepstreetNum",
                                value
                            )
                        }
                    />

                    <Field
                        label="Street"
                        value={
                            formData.buyerRepStreet
                        }
                        maxLength={60}
                        onChange={(value) =>
                            updateField(
                                "buyerRepStreet",
                                value
                            )
                        }
                    />

                    <Field
                        label="City"
                        value={
                            formData.buyerRepCity2
                        }
                        maxLength={40}
                        onChange={(value) =>
                            updateField(
                                "buyerRepCity2",
                                value
                            )
                        }
                    />

                    <Field
                        label="State"
                        value={
                            formData.buyerRepState2
                        }
                        maxLength={2}
                        onChange={(value) =>
                            updateField(
                                "buyerRepState2",
                                value
                            )
                        }
                    />

                    <Field
                        label="Zip Code"
                        value={
                            formData.buyerRepcode2
                        }
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "buyerRepcode2",
                                value
                            )
                        }
                    />

                    <Field
                        label="Phone"
                        value={
                            formData.buyerRepPhone
                        }
                        maxLength={20}
                        keyboardType="phone-pad"
                        onChange={(value) =>
                            updateField(
                                "buyerRepPhone",
                                value
                            )
                        }
                    />

                    <Field
                        label="Fax"
                        value={
                            formData.brkbuyerRepFax
                        }
                        maxLength={20}
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepFax",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Name"
                        value={
                            formData.brkbuyerRepLName
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepLName",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Firm"
                        value={
                            formData.brkbuyerRepLFirm
                        }
                        maxLength={80}
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepLFirm",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Address"
                        value={
                            formData.brkbuyerRepLAddr
                        }
                        maxLength={100}
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepLAddr",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer City"
                        value={
                            formData.brkbuyerRepLCity
                        }
                        maxLength={40}
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepLCity",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer State"
                        value={
                            formData.brkbuyerRepLstate
                        }
                        maxLength={2}
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepLstate",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Zip Code"
                        value={
                            formData.brkbuyerRepLZip
                        }
                        maxLength={10}
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepLZip",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Phone"
                        value={
                            formData.brkbuyerRepLPhone
                        }
                        maxLength={20}
                        keyboardType="phone-pad"
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepLPhone",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Fax"
                        value={
                            formData.brkbuyerRepLFax
                        }
                        maxLength={20}
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepLFax",
                                value
                            )
                        }
                    />

                    <Field
                        label="Lawyer Email"
                        value={
                            formData.brkbuyerRepLEmail
                        }
                        maxLength={80}
                        keyboardType="email-address"
                        onChange={(value) =>
                            updateField(
                                "brkbuyerRepLEmail",
                                value
                            )
                        }
                    />
                </Section>

                {/* =====================================================
                    FINAL ADMIN ACTIONS
                ====================================================== */}
                {isAdmin ? (
                    <View className="mt-2 gap-3 border-t border-gray-200 pt-5">
                        <Pressable
                            onPress={() =>
                                router.push(
                                    `/(transactions)/partypdfdata/${id}` as any
                                )
                            }
                            className="h-12 items-center justify-center rounded-xl border border-gray-300 bg-white active:bg-gray-100"
                        >
                            <Text className="font-semibold text-gray-700">
                                Party Docs List
                            </Text>
                        </Pressable>

                        <Pressable
                            disabled={saving}
                            onPress={handleSubmit}
                            className={`h-12 flex-row items-center justify-center rounded-xl ${
                                saving
                                    ? "bg-green-300"
                                    : "bg-green-600"
                            }`}
                        >
                            {saving ? (
                                <ActivityIndicator
                                    color="#ffffff"
                                />
                            ) : (
                                <>
                                    <Ionicons
                                        name="save-outline"
                                        size={19}
                                        color="#ffffff"
                                    />

                                    <Text className="ml-2 font-semibold text-white">
                                        Save
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                ) : null}
            </ScrollView>
        </View>
    );
}