
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import *as DocumentPicker from "expo-document-picker";
import { Check, ChevronDown, ChevronUp, FileText, Mail, Paperclip, Plus, Send, Trash2, User, X } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";

interface Party {
    _id?: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    licenseImage?: string;
    passportImage?: string;
}
interface Progress {
    completed: number;
    total: number;
    percent: number;
    steps: boolean[];
}
interface EmailData {
    to: string[];
    subject: string;
    message: string;
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

const PARTY_STEPS = [
    "Upload Docs",
    "Fintrac",
    "Politically Exposed",
    "CRG",
    "Documents",
];
const ROLES = ["Buyer", "Seller", "Agent", "Lawyer"];
const API_BASE = "https://realtorparth.ca/api";
const CURRENT_TRANSACTION_KEY = "currentTransactionId";

const getTransactionUserId = (transactionUser: TransactionUser | null): string | null => {
    if (!transactionUser) return null;
    if (typeof transactionUser.id === "string" && transactionUser.id.trim()) return transactionUser.id.trim();
    if (typeof transactionUser._id === "string" && transactionUser._id.trim()) return transactionUser._id.trim();
    if (typeof transactionUser.userId === "string" && transactionUser.userId.trim()) return transactionUser.userId.trim();
    return null;
};

export default function AddParties() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [transactionUserId, setTransactionUserId] = useState<string | null>(null);
    const [resolvingTransactionUser, setResolvingTransactionUser] = useState(true);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [parties, setParties] = useState<Party[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState<EmailData>({ to: [], subject: "", message: "" });
    const [searchEmail, setSearchEmail] = useState("");
    const [showRecipientList, setShowRecipientList] = useState(false);
    const [attachments, setAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
    const [expandedParties, setExpandedParties] = useState<Record<number, boolean>>({});
    const [removingIndex, setRemovingIndex] = useState<number | null>(null);

    const resolveTransactionUser = useCallback(async () => {
        if (!user?.email) throw new Error("Admin user not found. Please login again.");
        const adminEmail = user.email.trim();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch(`${API_BASE}/transactions/check-super-admin/${encodeURIComponent(adminEmail)}`, { method: "GET", signal: controller.signal });
            let data: any;
            try { data = await response.json(); } catch { throw new Error("Invalid server response"); }
            console.log("Transaction User Response:", data);
            if (!response.ok) throw new Error(data?.message || `Error ${response.status}`);
            if (!data?.success) throw new Error(data?.message || "Unable to verify transaction access.");
            if (!data?.isSuperAdmin) throw new Error("You do not have permission to access the Transaction Panel.");
            const transactionUser: TransactionUser | null = data?.user || data?.transactionUser || data?.admin || data;
            const id = getTransactionUserId(transactionUser);
            if (!id) {
                console.log("Transaction User ID missing:", data);
                throw new Error("Transaction user ID was not returned by the server.");
            }
            setTransactionUserId(id);
            return id;
        } finally { clearTimeout(timeout); }
    }, [user?.email]);

    useEffect(() => {
        if (authLoading) return;
        const loadTransactionData = async () => {
            try {
                setResolvingTransactionUser(true);
                const resolvedUserId = await resolveTransactionUser();
                if (!resolvedUserId) throw new Error("Transaction user not found.");
                const id = await AsyncStorage.getItem(CURRENT_TRANSACTION_KEY);
                if (!id) {
                    Alert.alert("Transaction Not Found", "Please create or select a transaction first.", [
                        { text: "OK", onPress: () => router.replace("/(transactions)" as any) }
                    ]);
                    return;
                }
                setTransactionId(id);
            } catch (error: any) {
                console.error("Load transaction data error:", error);
                if (error?.name === "AbortError") {
                    Alert.alert("Request Timed Out", "The server took too long to respond.");
                } else if (error?.name === "TypeError") {
                    Alert.alert("Server Error", "Server is down or there was a network error.");
                } else {
                    Alert.alert("Transaction Access Error", error?.message || "Unable to access Transaction Panel.");
                }
            } finally {
                setResolvingTransactionUser(false);
            }
        };
        loadTransactionData();
    }, [authLoading, resolveTransactionUser, router]);

    const fetchParties = useCallback(async () => {
        if (!transactionId || !transactionUserId) return;
        setLoading(true);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            try {
                const response = await fetch(`${API_BASE}/transactions/parties/${transactionId}/${transactionUserId}`, { method: "GET", signal: controller.signal });
                let data: any;
                try { data = await response.json(); } catch { throw new Error("Invalid server response"); }
                if (!response.ok) throw new Error(data?.message || `Error ${response.status}`);
                if (data?.success && Array.isArray(data.parties)) {
                    if (data.parties.length > 0) {
                        const loadedParties: Party[] = data.parties.map((party: any) => ({
                            _id: party._id,
                            name: party.name || "",
                            email: party.email || "",
                            phone: party.phone || "",
                            role: party.role || "Buyer",
                            licenseImage: party.licenseImage,
                            passportImage: party.passportImage,
                        }));
                        setParties(loadedParties);
                        /*
                         * All party dropdowns are CLOSED by default.
                         */
                        const closedState: Record<number, boolean> = {};
                        loadedParties.forEach((_, index) => {
                            closedState[index] = false;
                        });
                        setExpandedParties(closedState);
                    } else {
                        setParties([{
                            name: "",
                            email: "",
                            phone: "",
                            role: "Buyer",
                        }]);
                        setExpandedParties({ 0: false });
                    }
                }
            } finally { clearTimeout(timeout); }
        } catch (error: any) {
            console.error("Fetch Parties Error:", error);
            if (error?.name === "AbortError") {
                Alert.alert("Request Timed Out", "The server took too long to respond.");
            } else if (error?.name === "TypeError") {
                Alert.alert("Server Error", "Server is down or there was a network error.");
            } else {
                Alert.alert("Error", error?.message || "Failed to load parties");
            }
        } finally {
            setLoading(false);
        }
    }, [transactionId, transactionUserId]);

    useEffect(() => {
        fetchParties();
    }, [fetchParties]);

    const updateParty = (index: number, field: keyof Party, value: string) => {
        setParties(previous => previous.map((party, partyIndex) => partyIndex === index ? { ...party, [field]: value } : party));
    };

    const addParty = () => {
        if (parties.length >= 4) {
            Alert.alert("Maximum Parties", "Maximum 4 parties allowed.");
            return;
        }
        const newIndex = parties.length;
        setParties(previous => [...previous, { name: "", email: "", phone: "", role: "Buyer" }]);
        /*
         * New parties are also CLOSED by default.
         */
        setExpandedParties(previous => ({ ...previous, [newIndex]: false }));
    };

    const removeParty = async (index: number) => {
        const party = parties[index];
        setRemovingIndex(index);
        try {
            if (party._id) {
                if (!transactionUserId) throw new Error("Transaction user not found.");
                const response = await fetch(`${API_BASE}/transactions/parties/${party._id}/${transactionUserId}`, { method: "DELETE" });
                let data: any;
                try { data = await response.json(); } catch { throw new Error("Invalid server response"); }
                if (!response.ok || !data?.success) throw new Error(data?.message || "Failed to delete party");
            }
            setParties(previous => previous.filter((_, partyIndex) => partyIndex !== index));
            setExpandedParties(previous => {
                const next: Record<number, boolean> = {};
                Object.keys(previous).forEach(key => {
                    const oldIndex = Number(key);
                    if (oldIndex < index) next[oldIndex] = previous[oldIndex];
                    if (oldIndex > index) next[oldIndex - 1] = previous[oldIndex];
                });
                return next;
            });
            Alert.alert("Party Removed", "Party removed successfully.");
        } catch (error: any) {
            console.error("Delete Party Error:", error);
            if (error?.name === "TypeError") {
                Alert.alert("Server Error", "Server is down or there was a network error.");
            } else {
                Alert.alert("Error", error?.message || "Failed to delete party");
            }
        } finally {
            setRemovingIndex(null);
        }
    };

    const confirmRemoveParty = (index: number) => {
        Alert.alert("Remove Party", "Are you sure you want to remove this party?", [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: () => removeParty(index) },
        ]);
    };

    const getPartyStepStatus = async (party: Party): Promise<Progress> => {
        if (!party._id) return { completed: 0, total: 5, percent: 0, steps: [] };
        try {
            const [fintracRes, pepRes, crgRes, docsRes] = await Promise.all([
                fetch(`${API_BASE}/fintracpdf/fintrac/user/${party._id}`),
                fetch(`${API_BASE}/fintracpeppdf/pep/user/${party._id}`),
                fetch(`${API_BASE}/crgpdf/crg/user/${party._id}`),
                fetch(`${API_BASE}/statuspdf/document-status/pdf/${party._id}`),
            ]);
            const [fintracData, pepData, crgData, docsData] = await Promise.all([
                fintracRes.json(),
                pepRes.json(),
                crgRes.json(),
                docsRes.json(),
            ]);
            let docCompletion = 0;
            if (docsData?.data) {
                const d = docsData.data;
                const buyerDocs = [d.EBRAA, d.EBRATDA, d.RPC, d.EBRADA];
                const sellerDocs = [d.SCSAAFA, d.IDMMGOL, d.ESRAA];
                const buyerCompletion = buyerDocs.filter(Boolean).length / buyerDocs.length;
                const sellerCompletion = sellerDocs.filter(Boolean).length / sellerDocs.length;
                if (buyerCompletion > 0 || sellerCompletion > 0) {
                    docCompletion = Math.max(buyerCompletion, sellerCompletion);
                }
            }
            const steps = [
                !!(party.licenseImage || party.passportImage),
                !!fintracData?.data,
                !!pepData?.data,
                !!crgData?.data,
                docCompletion === 1,
            ];
            const completed = steps.filter(Boolean).length;
            return {
                completed,
                total: steps.length,
                percent: Math.round((completed / steps.length) * 100),
                steps,
            };
        } catch (error) {
            console.error("Step check error:", error);
            return { completed: 0, total: 5, percent: 0, steps: [] };
        }
    };

    const refreshProgress = useCallback(async () => {
        const savedParties = parties.filter(party => party._id);
        if (!savedParties.length) return;
        const results = await Promise.all(savedParties.map(async party => {
            const result = await getPartyStepStatus(party);
            return { id: party._id!, result };
        }));
        const newMap: Record<string, Progress> = {};
        results.forEach(({ id, result }) => {
            newMap[id] = result;
        });
        setProgressMap(newMap);
    }, [parties]);

    useEffect(() => {
        refreshProgress();
    }, [refreshProgress]);

    const handleNext = async () => {
        if (parties.some(party => !party.name.trim() || !party.email.trim())) {
            Alert.alert("Required Fields", "Please fill in the required Name and Email fields for every party.");
            return;
        }
        if (!transactionId || !transactionUserId) {
            Alert.alert("Transaction Not Found", "Please create or select a transaction first.");
            return;
        }
        setSaving(true);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            try {
                const response = await fetch(`${API_BASE}/transactions/parties/save`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        transactionId,
                        userId: transactionUserId,
                        parties: parties.map(party => ({
                            _id: party._id,
                            name: party.name.trim(),
                            email: party.email.trim(),
                            phone: party.phone.trim(),
                            role: party.role,
                        })),
                    }),
                    signal: controller.signal,
                });
                let data: any;
                try { data = await response.json(); } catch { throw new Error("Invalid server response"); }
                if (!response.ok) throw new Error(data?.message || `Error ${response.status}`);
                if (!data?.success) throw new Error(data?.message || "Failed to save parties");
                Alert.alert("Success", "Parties saved successfully.");
                await fetchParties();
                await refreshProgress();
            } finally {
                clearTimeout(timeout);
            }
        } catch (error: any) {
            console.error("Save Parties Error:", error);
            if (error?.name === "AbortError") {
                Alert.alert("Request Timed Out", "The server took too long to respond.");
            } else if (error?.name === "TypeError") {
                Alert.alert("Server Error", "Server is down or there was a network error.");
            } else {
                Alert.alert("Error", error?.message || "Server error");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
            if (result.canceled) return;
            setAttachments(previous => [...previous, ...result.assets]);
        } catch (error) {
            console.error("Document picker error:", error);
            Alert.alert("Error", "Unable to select files.");
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(previous => previous.filter((_, attachmentIndex) => attachmentIndex !== index));
    };

    const toggleRecipient = (email: string) => {
        setEmailData(previous => {
            const exists = previous.to.includes(email);
            return {
                ...previous,
                to: exists ? previous.to.filter(item => item !== email) : [...previous.to, email],
            };
        });
    };

    const filteredParties = useMemo(() => {
        const search = searchEmail.trim().toLowerCase();
        if (!search) return parties;
        return parties.filter(party => party.email.toLowerCase().includes(search) || party.name.toLowerCase().includes(search));
    }, [parties, searchEmail]);

    const handleSendEmail = async () => {
        if (emailData.to.length === 0) {
            Alert.alert("Recipients Required", "Please select at least one recipient.");
            return;
        }
        if (!transactionId) {
            Alert.alert("Transaction Not Found", "Please create a transaction first.");
            return;
        }
        try {
            const formData = new FormData();
            formData.append("subject", emailData.subject);
            formData.append("message", emailData.message);
            formData.append("transactionId", transactionId);
            emailData.to.forEach(email => formData.append("to", email));
            attachments.forEach(file => {
                if (!file.uri) return;
                formData.append("attachments", {
                    uri: file.uri,
                    name: file.name || `attachment-${Date.now()}`,
                    type: file.mimeType || "application/octet-stream",
                } as any);
            });
            const response = await fetch(`${API_BASE}/transactions/parties/send-email`, {
                method: "POST",
                body: formData,
            });
            let data: any;
            try { data = await response.json(); } catch { throw new Error("Invalid server response"); }
            if (!response.ok || !data?.success) throw new Error(data?.message || "Failed to send email");
            Alert.alert("Email Sent", "Email sent successfully.");
            setShowEmailModal(false);
            setEmailData({ to: [], subject: "", message: "" });
            setSearchEmail("");
            setAttachments([]);
            setShowRecipientList(false);
        } catch (error: any) {
            console.error("Send Email Error:", error);
            Alert.alert("Email Error", error?.message || "Failed to send email");
        }
    };

    const toggleParty = (index: number) => {
        setExpandedParties(previous => ({
            ...previous,
            [index]: !(previous[index] ?? false),
        }));
    };

    if (authLoading || resolvingTransactionUser || loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#9a6a3a" />
                <Text className="mt-4 text-sm text-gray-500">Loading parties...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: "Add Parties" }} />
            <KeyboardAvoidingView className="flex-1 bg-gray-50" behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}>
                    <View className="mb-6">
                        <View className="flex-row items-center">
                            <View className="flex-1">
                                <Text className="text-2xl font-bold text-gray-800">Add Parties</Text>
                                <Text className="mt-1 text-sm text-gray-500">You can add up to 4 parties to this transaction.</Text>
                            </View>
                        </View>
                        <Pressable
                            onPress={() =>
                                router.replace(
                                    "/(transactions)/new-transaction?mode=edit" as any
                                )
                            }
                            className="mt-4 h-12 flex-row items-center justify-center rounded-2xl border border-[#9a6a3a] bg-white"
                        >
                            <FileText size={18} color="#9a6a3a" />
                            <Text className="ml-2 text-sm font-semibold text-[#9a6a3a]">
                                Edit Transaction
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setShowEmailModal(true)}
                            className="mt-3 h-12 flex-row items-center justify-center rounded-2xl bg-[#9a6a3a]"
                            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                        >
                            <Mail size={19} color="#ffffff" />
                            <Text className="ml-2 text-sm font-semibold text-white">Send Email</Text>
                        </Pressable>
                    </View>
                    <View className="gap-5">
                        {parties.map((party, index) => {
                            const progress = party._id ? progressMap[party._id] : undefined;
                            const currentProgress = progress || { completed: 0, total: 5, percent: 0, steps: [] };
                            const expanded = expandedParties[index] ?? false;
                            const isRemoving = removingIndex === index;
                            return (
                                <View key={party._id || `party-${index}`} className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
                                    <View className="border-b border-gray-100 px-5 py-4">
                                        <View className="flex-row items-center">
                                            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#9a6a3a]/10">
                                                <Text className="text-base font-bold text-[#9a6a3a]">{index + 1}</Text>
                                            </View>
                                            <View className="ml-3 flex-1">
                                                <Text className="text-lg font-semibold text-gray-800">Party {index + 1}</Text>
                                                <Text className="mt-0.5 text-xs text-gray-500">{party.name || party.role || "Buyer/Seller information"}</Text>
                                            </View>
                                            <Pressable onPress={() => toggleParty(index)} className="h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                                                {expanded ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#6b7280" />}
                                            </Pressable>
                                        </View>
                                        <View className="mt-4 flex-row gap-3">
                                            {party._id && (
                                                <Pressable
                                                    onPress={() => router.push(`/(transactions)/partypdfdata/${party._id}` as any)}
                                                    className="h-11 flex-1 flex-row items-center justify-center rounded-xl border border-gray-200"
                                                >
                                                    <FileText size={17} color="#4b5563" />
                                                    <Text className="ml-2 text-sm font-medium text-gray-600">See Docs</Text>
                                                </Pressable>
                                            )}
                                            {parties.length > 1 && (
                                                <Pressable
                                                    disabled={isRemoving}
                                                    onPress={() => confirmRemoveParty(index)}
                                                    className="h-11 w-11 items-center justify-center rounded-xl bg-red-50"
                                                >
                                                    {isRemoving ? <ActivityIndicator size="small" color="#ef4444" /> : <Trash2 size={18} color="#ef4444" />}
                                                </Pressable>
                                            )}
                                        </View>
                                    </View>
                                    {expanded && (
                                        <View className="p-5">
                                            <View className="mb-5">
                                                <Text className="mb-2 text-sm font-medium text-gray-600">Full Name<Text className="text-red-500"> *</Text></Text>
                                                <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
                                                    <User size={18} color="#9ca3af" />
                                                    <TextInput value={party.name} onChangeText={value => updateParty(index, "name", value)} placeholder="Enter full name" placeholderTextColor="#9ca3af" autoCapitalize="words" className="ml-3 flex-1 py-3.5 text-base text-gray-800" />
                                                </View>
                                            </View>
                                            <View className="mb-5">
                                                <Text className="mb-2 text-sm font-medium text-gray-600">Email<Text className="text-red-500"> *</Text></Text>
                                                <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
                                                    <Mail size={18} color="#9ca3af" />
                                                    <TextInput value={party.email} onChangeText={value => updateParty(index, "email", value)} placeholder="Enter email address" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} className="ml-3 flex-1 py-3.5 text-base text-gray-800" />
                                                </View>
                                            </View>
                                            <View className="mb-5">
                                                <Text className="mb-2 text-sm font-medium text-gray-600">Phone</Text>
                                                <TextInput value={party.phone} onChangeText={value => updateParty(index, "phone", value)} placeholder="Enter phone number" placeholderTextColor="#9ca3af" keyboardType="phone-pad" className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-800" />
                                            </View>
                                            <View className="mb-5">
                                                <Text className="mb-2 text-sm font-medium text-gray-600">Role</Text>
                                                <View className="flex-row flex-wrap gap-2">
                                                    {ROLES.map(role => {
                                                        const selected = party.role === role;
                                                        return (
                                                            <Pressable key={role} onPress={() => updateParty(index, "role", role)} className={`rounded-xl px-4 py-2.5 ${selected ? "bg-[#9a6a3a]" : "bg-gray-100"}`}>
                                                                <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-gray-600"}`}>{role}</Text>
                                                            </Pressable>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                            {(party.licenseImage || party.passportImage) && (
                                                <View className="mb-6">
                                                    <Text className="mb-3 text-sm font-semibold text-gray-700">Uploaded Documents</Text>
                                                    <View className="gap-4">
                                                        {party.licenseImage && (
                                                            <View className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-3">
                                                                <Text className="mb-2 text-xs font-medium text-gray-500">Driving License</Text>
                                                                <Image source={{ uri: party.licenseImage }} className="h-44 w-full rounded-xl" resizeMode="cover" />
                                                            </View>
                                                        )}
                                                        {party.passportImage && (
                                                            <View className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-3">
                                                                <Text className="mb-2 text-xs font-medium text-gray-500">Passport</Text>
                                                                <Image source={{ uri: party.passportImage }} className="h-44 w-full rounded-xl" resizeMode="cover" />
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            )}
                                            <View className="rounded-3xl border border-gray-200 bg-gray-50/70 p-5">
                                                <View className="flex-row items-start justify-between">
                                                    <View className="flex-1">
                                                        <Text className="text-base font-semibold text-gray-800">Completion Progress</Text>
                                                        <Text className="mt-1 text-sm text-gray-500">{currentProgress.completed} of {currentProgress.total} steps completed</Text>
                                                    </View>
                                                    <Text className="text-xl font-bold text-[#9a6a3a]">{currentProgress.percent}%</Text>
                                                </View>
                                                <View className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200">
                                                    <View className="h-full rounded-full bg-[#9a6a3a]" style={{ width: `${currentProgress.percent}%` }} />
                                                </View>
                                                <View className="mt-6">
                                                    {PARTY_STEPS.map((step, stepIndex) => {
                                                        const isDone = currentProgress.steps[stepIndex];
                                                        const isCurrent = !isDone && stepIndex === currentProgress.completed;
                                                        return (
                                                            <View key={step} className="mb-4 flex-row items-center">
                                                                <View className={`h-9 w-9 items-center justify-center rounded-full ${isDone ? "bg-green-500" : isCurrent ? "bg-yellow-400" : "border border-gray-300 bg-white"}`}>
                                                                    {isDone ? <Check size={17} color="#ffffff" /> : <Text className={`text-xs font-bold ${isCurrent ? "text-white" : "text-gray-400"}`}>{stepIndex + 1}</Text>}
                                                                </View>
                                                                <View className="ml-3 flex-1">
                                                                    <Text className={`text-sm font-medium ${isDone ? "text-green-600" : isCurrent ? "text-yellow-600" : "text-gray-400"}`}>{step}</Text>
                                                                    <Text className="mt-0.5 text-xs text-gray-400">{isDone ? "Completed" : isCurrent ? "Current step" : "Not completed"}</Text>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                    {parties.length < 4 && (
                        <Pressable onPress={addParty} className="mt-5 h-14 flex-row items-center justify-center rounded-2xl border border-dashed border-[#9a6a3a]" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                            <Plus size={20} color="#9a6a3a" />
                            <Text className="ml-2 text-sm font-semibold text-[#9a6a3a]">Add Party</Text>
                        </Pressable>
                    )}
                    <View className="mt-6 border-t border-gray-200 pt-5">
                        {/* <Pressable
                            onPress={()=>router.replace("/(transactions)/new-transaction" as any)}
                            className="mb-3 h-14 items-center justify-center rounded-2xl border border-gray-200 bg-white"
                        >
                            <Text className="text-sm font-semibold text-gray-600">Edit Transaction</Text>
                        </Pressable> */}
                        <Pressable
                            onPress={handleNext}
                            disabled={saving}
                            className="h-14 flex-row items-center justify-center rounded-2xl bg-[#9a6a3a]"
                            style={({ pressed }) => ({ opacity: saving ? 0.6 : pressed ? 0.85 : 1 })}
                        >
                            {saving ? <ActivityIndicator size="small" color="#ffffff" /> : <Send size={18} color="#ffffff" />}
                            <Text className="ml-2 text-sm font-semibold text-white">{saving ? "Saving..." : "Add Parties & Send E-Mail"}</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <Modal visible={showEmailModal} animationType="slide" transparent onRequestClose={() => setShowEmailModal(false)}>
                <View className="flex-1 justify-end bg-black/50">
                    <KeyboardAvoidingView className="max-h-[92%]" behavior={Platform.OS === "ios" ? "padding" : undefined}>
                        <View className="rounded-t-3xl bg-white">
                            <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-5">
                                <View className="flex-1">
                                    <Text className="text-xl font-bold text-gray-800">New Message</Text>
                                    <Text className="mt-1 text-sm text-gray-500">Send email to selected parties</Text>
                                </View>
                                <Pressable onPress={() => setShowEmailModal(false)} className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                                    <X size={20} color="#374151" />
                                </Pressable>
                            </View>
                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 30 }}>
                                <View className="mb-5">
                                    <Text className="mb-2 text-sm font-medium text-gray-600">To</Text>
                                    <Pressable onPress={() => setShowRecipientList(previous => !previous)} className="min-h-[56px] flex-row flex-wrap items-center rounded-2xl border border-gray-200 bg-gray-50 p-3">
                                        {emailData.to.length === 0 ? <Text className="flex-1 text-sm text-gray-400">Select recipients...</Text> : <View className="flex-1 flex-row flex-wrap gap-2">{emailData.to.map(email => <Pressable key={email} onPress={() => toggleRecipient(email)} className="flex-row items-center rounded-xl bg-[#9a6a3a]/10 px-3 py-2"><Text numberOfLines={1} className="max-w-[230px] text-xs font-medium text-[#9a6a3a]">{email}</Text><X size={14} color="#9a6a3a" style={{ marginLeft: 5 }} /></Pressable>)}</View>}
                                        <ChevronDown size={18} color="#9ca3af" />
                                    </Pressable>
                                    {showRecipientList && (
                                        <View className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                            <View className="border-b border-gray-100 px-3 py-2">
                                                <TextInput value={searchEmail} onChangeText={setSearchEmail} placeholder="Search name or email..." placeholderTextColor="#9ca3af" autoCapitalize="none" className="py-2 text-sm text-gray-700" />
                                            </View>
                                            {filteredParties.filter(party => !emailData.to.includes(party.email)).map(party => (
                                                <Pressable key={party._id || party.email} onPress={() => toggleRecipient(party.email)} className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
                                                    <View className="mr-3 flex-1">
                                                        <Text className="text-sm font-medium text-gray-700">{party.name || "Unnamed Party"}</Text>
                                                        <Text className="mt-1 text-xs text-gray-400">{party.email}</Text>
                                                    </View>
                                                    <Text className="text-xs font-medium text-gray-400">{party.role}</Text>
                                                </Pressable>
                                            ))}
                                            {filteredParties.filter(party => !emailData.to.includes(party.email)).length === 0 && (
                                                <Text className="px-4 py-4 text-center text-sm text-gray-400">No recipients found</Text>
                                            )}
                                        </View>
                                    )}
                                </View>
                                <View className="mb-5">
                                    <Text className="mb-2 text-sm font-medium text-gray-600">Subject</Text>
                                    <TextInput value={emailData.subject} onChangeText={value => setEmailData(previous => ({ ...previous, subject: value }))} placeholder="Enter subject..." placeholderTextColor="#9ca3af" className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-800" />
                                </View>
                                <View className="mb-5">
                                    <Text className="mb-2 text-sm font-medium text-gray-600">Message</Text>
                                    <TextInput value={emailData.message} onChangeText={value => setEmailData(previous => ({ ...previous, message: value }))} placeholder="Write your message..." placeholderTextColor="#9ca3af" multiline numberOfLines={7} textAlignVertical="top" className="min-h-[160px] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base leading-6 text-gray-800" />
                                </View>
                                <View>
                                    <Text className="mb-3 text-sm font-medium text-gray-600">Attachments</Text>
                                    <Pressable onPress={handleFileChange} className="h-12 flex-row items-center justify-center rounded-2xl border border-gray-200 bg-white">
                                        <Paperclip size={18} color="#4b5563" />
                                        <Text className="ml-2 text-sm font-medium text-gray-600">Add Files</Text>
                                    </Pressable>
                                    {attachments.length > 0 && (
                                        <View className="mt-4 gap-2">
                                            {attachments.map((file, index) => (
                                                <View key={`${file.uri}-${index}`} className="flex-row items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                                                    <FileText size={17} color="#9ca3af" />
                                                    <Text numberOfLines={1} className="ml-3 flex-1 text-sm text-gray-700">{file.name}</Text>
                                                    <Pressable onPress={() => removeAttachment(index)}>
                                                        <X size={18} color="#ef4444" />
                                                    </Pressable>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                            <View className="border-t border-gray-100 px-5 py-4">
                                <View className="flex-row gap-3">
                                    <Pressable onPress={() => setShowEmailModal(false)} className="h-12 flex-1 items-center justify-center rounded-2xl border border-gray-200">
                                        <Text className="text-sm font-semibold text-gray-600">Cancel</Text>
                                    </Pressable>
                                    <Pressable onPress={handleSendEmail} className="h-12 flex-1 flex-row items-center justify-center rounded-2xl bg-[#9a6a3a]">
                                        <Send size={17} color="#ffffff" />
                                        <Text className="ml-2 text-sm font-semibold text-white">Send Email</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}







































// // app/(transactions)/parties.tsx

// import React, {
//     useCallback,
//     useEffect,
//     useMemo,
//     useState,
// } from "react";

// import {
//     ActivityIndicator,
//     Alert,
//     Image,
//     KeyboardAvoidingView,
//     Modal,
//     Platform,
//     Pressable,
//     ScrollView,
//     Text,
//     TextInput,
//     View,
// } from "react-native";

// import { Stack, useRouter } from "expo-router";

// import AsyncStorage from "@react-native-async-storage/async-storage";

// import * as DocumentPicker from "expo-document-picker";

// import {
//     ArrowLeft,
//     Check,
//     ChevronDown,
//     ChevronUp,
//     FileText,
//     Mail,
//     Paperclip,
//     Plus,
//     Send,
//     Trash2,
//     User,
//     X,
// } from "lucide-react-native";

// import { useAuth } from "../../contexts/AuthContext";


// // ============================================================
// // TYPES
// // ============================================================

// interface Party {
//     _id?: string;
//     name: string;
//     email: string;
//     phone: string;
//     role: string;
//     licenseImage?: string;
//     passportImage?: string;
// }

// interface Progress {
//     completed: number;
//     total: number;
//     percent: number;
//     steps: boolean[];
// }

// interface EmailData {
//     to: string[];
//     subject: string;
//     message: string;
// }

// interface TransactionUser {
//     id?: string;
//     _id?: string;
//     userId?: string;
//     name?: string;
//     email?: string;
//     role?: string;
//     isSuperAdmin?: boolean;
// }


// // ============================================================
// // CONSTANTS
// // ============================================================

// const PARTY_STEPS = [
//     "Upload Docs",
//     "Fintrac",
//     "Politically Exposed",
//     "CRG",
//     "Documents",
// ];

// const ROLES = [
//     "Buyer",
//     "Seller",
//     "Agent",
//     "Lawyer",
// ];

// const API_BASE =
//     "https://realtorparth.ca/api";

// const CURRENT_TRANSACTION_KEY =
//     "currentTransactionId";


// // ============================================================
// // TRANSACTION USER ID HELPER
// // ============================================================

// const getTransactionUserId = (
//     transactionUser: TransactionUser | null
// ): string | null => {
//     if (!transactionUser) {
//         return null;
//     }

//     if (
//         typeof transactionUser.id === "string" &&
//         transactionUser.id.trim()
//     ) {
//         return transactionUser.id;
//     }

//     if (
//         typeof transactionUser._id === "string" &&
//         transactionUser._id.trim()
//     ) {
//         return transactionUser._id;
//     }

//     if (
//         typeof transactionUser.userId === "string" &&
//         transactionUser.userId.trim()
//     ) {
//         return transactionUser.userId;
//     }

//     return null;
// };


// // ============================================================
// // COMPONENT
// // ============================================================

// export default function AddParties() {
//     const router = useRouter();

//     const {
//         user,
//         loading: authLoading,
//     } = useAuth();


//     // ========================================================
//     // TRANSACTION USER
//     // ========================================================

//     const [
//         transactionUserId,
//         setTransactionUserId,
//     ] = useState<string | null>(null);

//     const [
//         resolvingTransactionUser,
//         setResolvingTransactionUser,
//     ] = useState(true);


//     // ========================================================
//     // TRANSACTION
//     // ========================================================

//     const [
//         transactionId,
//         setTransactionId,
//     ] = useState<string | null>(null);


//     // ========================================================
//     // PARTIES
//     // ========================================================

//     const [parties, setParties] =
//         useState<Party[]>([
//             {
//                 name: "",
//                 email: "",
//                 phone: "",
//                 role: "Buyer",
//             },
//         ]);


//     // ========================================================
//     // LOADING
//     // ========================================================

//     const [loading, setLoading] =
//         useState(true);

//     const [saving, setSaving] =
//         useState(false);


//     // ========================================================
//     // PROGRESS
//     // ========================================================

//     const [
//         progressMap,
//         setProgressMap,
//     ] = useState<Record<string, Progress>>({});


//     // ========================================================
//     // EMAIL
//     // ========================================================

//     const [
//         showEmailModal,
//         setShowEmailModal,
//     ] = useState(false);

//     const [
//         emailData,
//         setEmailData,
//     ] = useState<EmailData>({
//         to: [],
//         subject: "",
//         message: "",
//     });

//     const [
//         searchEmail,
//         setSearchEmail,
//     ] = useState("");

//     const [
//         showRecipientList,
//         setShowRecipientList,
//     ] = useState(false);


//     // ========================================================
//     // ATTACHMENTS
//     // ========================================================

//     const [
//         attachments,
//         setAttachments,
//     ] = useState<
//         DocumentPicker.DocumentPickerAsset[]
//     >([]);


//     // ========================================================
//     // PARTY UI
//     // ========================================================

//     const [
//         expandedParties,
//         setExpandedParties,
//     ] = useState<
//         Record<number, boolean>
//     >({});

//     const [
//         removingIndex,
//         setRemovingIndex,
//     ] = useState<number | null>(null);


//     // ============================================================
//     // RESOLVE TRANSACTION USER
//     // ============================================================

//     const resolveTransactionUser =
//         useCallback(async () => {
//             if (!user?.email) {
//                 throw new Error(
//                     "Admin user not found. Please login again."
//                 );
//             }

//             const adminEmail =
//                 user.email.trim();

//             const controller =
//                 new AbortController();

//             const timeout = setTimeout(() => {
//                 controller.abort();
//             }, 10000);

//             try {
//                 const response =
//                     await fetch(
//                         `${API_BASE}/transactions/check-super-admin/${encodeURIComponent(
//                             adminEmail
//                         )}`,
//                         {
//                             method: "GET",
//                             signal: controller.signal,
//                         }
//                     );

//                 let data: any;

//                 try {
//                     data =
//                         await response.json();
//                 } catch {
//                     throw new Error(
//                         "Invalid server response"
//                     );
//                 }

//                 console.log(
//                     "Transaction User Response:",
//                     data
//                 );

//                 if (!response.ok) {
//                     throw new Error(
//                         data?.message ||
//                         `Error ${response.status}`
//                     );
//                 }

//                 if (!data?.success) {
//                     throw new Error(
//                         data?.message ||
//                         "Unable to verify transaction access."
//                     );
//                 }

//                 if (!data?.isSuperAdmin) {
//                     throw new Error(
//                         "You do not have permission to access the Transaction Panel."
//                     );
//                 }

//                 /*
//                  * Resolve the Transaction user.
//                  *
//                  * We support the possible response structures
//                  * until the backend response is confirmed.
//                  */
//                 const transactionUser:
//                     | TransactionUser
//                     | null =
//                     data?.user ||
//                     data?.transactionUser ||
//                     data?.admin ||
//                     data;

//                 const id =
//                     getTransactionUserId(
//                         transactionUser
//                     );

//                 if (!id) {
//                     console.log(
//                         "Transaction User ID missing:",
//                         data
//                     );

//                     throw new Error(
//                         "Transaction user ID was not returned by the server."
//                     );
//                 }

//                 setTransactionUserId(id);

//                 return id;
//             } finally {
//                 clearTimeout(timeout);
//             }
//         }, [user?.email]);


//     // ============================================================
//     // LOAD TRANSACTION ID
//     // ============================================================

//     useEffect(() => {
//         if (authLoading) {
//             return;
//         }

//         const loadTransactionData =
//             async () => {
//                 try {
//                     setResolvingTransactionUser(
//                         true
//                     );

//                     /*
//                      * Resolve the Transaction user
//                      * from the Admin email.
//                      */
//                     const resolvedUserId =
//                         await resolveTransactionUser();

//                     if (!resolvedUserId) {
//                         throw new Error(
//                             "Transaction user not found."
//                         );
//                     }

//                     /*
//                      * Load currently selected transaction.
//                      */
//                     const id =
//                         await AsyncStorage.getItem(
//                             CURRENT_TRANSACTION_KEY
//                         );

//                     if (!id) {
//                         Alert.alert(
//                             "Transaction Not Found",
//                             "Please create or select a transaction first.",
//                             [
//                                 {
//                                     text: "OK",
//                                     onPress: () =>
//                                         router.replace(
//                                             "/(transactions)" as any
//                                         ),
//                                 },
//                             ]
//                         );

//                         return;
//                     }

//                     setTransactionId(id);
//                 } catch (error: any) {
//                     console.error(
//                         "Load transaction data error:",
//                         error
//                     );

//                     if (
//                         error?.name ===
//                         "AbortError"
//                     ) {
//                         Alert.alert(
//                             "Request Timed Out",
//                             "The server took too long to respond."
//                         );
//                     } else if (
//                         error?.name ===
//                         "TypeError"
//                     ) {
//                         Alert.alert(
//                             "Server Error",
//                             "Server is down or there was a network error."
//                         );
//                     } else {
//                         Alert.alert(
//                             "Transaction Access Error",
//                             error?.message ||
//                             "Unable to access Transaction Panel."
//                         );
//                     }
//                 } finally {
//                     setResolvingTransactionUser(
//                         false
//                     );
//                 }
//             };

//         loadTransactionData();
//     }, [
//         authLoading,
//         resolveTransactionUser,
//         router,
//     ]);


//     // ============================================================
//     // LOAD PARTIES
//     // ============================================================

//     const fetchParties =
//         useCallback(async () => {
//             if (
//                 !transactionId ||
//                 !transactionUserId
//             ) {
//                 return;
//             }

//             setLoading(true);

//             try {
//                 const controller =
//                     new AbortController();

//                 const timeout = setTimeout(() => {
//                     controller.abort();
//                 }, 10000);

//                 try {
//                     const response =
//                         await fetch(
//                             `${API_BASE}/transactions/parties/${transactionId}/${transactionUserId}`,
//                             {
//                                 method: "GET",
//                                 signal: controller.signal,
//                             }
//                         );

//                     let data: any;

//                     try {
//                         data =
//                             await response.json();
//                     } catch {
//                         throw new Error(
//                             "Invalid server response"
//                         );
//                     }

//                     if (!response.ok) {
//                         throw new Error(
//                             data?.message ||
//                             `Error ${response.status}`
//                         );
//                     }

//                     if (
//                         data?.success &&
//                         Array.isArray(
//                             data.parties
//                         ) &&
//                         data.parties.length > 0
//                     ) {
//                         setParties(
//                             data.parties.map(
//                                 (
//                                     party: any
//                                 ) => ({
//                                     _id: party._id,
//                                     name:
//                                         party.name ||
//                                         "",
//                                     email:
//                                         party.email ||
//                                         "",
//                                     phone:
//                                         party.phone ||
//                                         "",
//                                     role:
//                                         party.role ||
//                                         "Buyer",
//                                     licenseImage:
//                                         party.licenseImage,
//                                     passportImage:
//                                         party.passportImage,
//                                 })
//                             )
//                         );
//                     }
//                 } finally {
//                     clearTimeout(timeout);
//                 }
//             } catch (error: any) {
//                 console.error(
//                     "Fetch Parties Error:",
//                     error
//                 );

//                 if (
//                     error?.name ===
//                     "AbortError"
//                 ) {
//                     Alert.alert(
//                         "Request Timed Out",
//                         "The server took too long to respond."
//                     );
//                 } else if (
//                     error?.name ===
//                     "TypeError"
//                 ) {
//                     Alert.alert(
//                         "Server Error",
//                         "Server is down or there was a network error."
//                     );
//                 } else {
//                     Alert.alert(
//                         "Error",
//                         error?.message ||
//                         "Failed to load parties"
//                     );
//                 }
//             } finally {
//                 setLoading(false);
//             }
//         }, [
//             transactionId,
//             transactionUserId,
//         ]);


//     useEffect(() => {
//         fetchParties();
//     }, [fetchParties]);


//     // ============================================================
//     // UPDATE PARTY
//     // ============================================================

//     const updateParty = (
//         index: number,
//         field: keyof Party,
//         value: string
//     ) => {
//         setParties((previous) =>
//             previous.map(
//                 (party, partyIndex) =>
//                     partyIndex === index
//                         ? {
//                             ...party,
//                             [field]: value,
//                         }
//                         : party
//             )
//         );
//     };


//     // ============================================================
//     // ADD PARTY
//     // ============================================================

//     const addParty = () => {
//         if (parties.length >= 4) {
//             Alert.alert(
//                 "Maximum Parties",
//                 "Maximum 4 parties allowed."
//             );

//             return;
//         }

//         setParties((previous) => [
//             ...previous,
//             {
//                 name: "",
//                 email: "",
//                 phone: "",
//                 role: "Buyer",
//             },
//         ]);

//         setExpandedParties(
//             (previous) => ({
//                 ...previous,
//                 [parties.length]: true,
//             })
//         );
//     };


//     // ============================================================
//     // REMOVE PARTY
//     // ============================================================

//     const removeParty =
//         async (index: number) => {
//             const party =
//                 parties[index];

//             setRemovingIndex(index);

//             try {
//                 if (party._id) {
//                     if (!transactionUserId) {
//                         throw new Error(
//                             "Transaction user not found."
//                         );
//                     }

//                     const response =
//                         await fetch(
//                             `${API_BASE}/transactions/parties/${party._id}/${transactionUserId}`,
//                             {
//                                 method: "DELETE",
//                             }
//                         );

//                     let data: any;

//                     try {
//                         data =
//                             await response.json();
//                     } catch {
//                         throw new Error(
//                             "Invalid server response"
//                         );
//                     }

//                     if (
//                         !response.ok ||
//                         !data?.success
//                     ) {
//                         throw new Error(
//                             data?.message ||
//                             "Failed to delete party"
//                         );
//                     }
//                 }

//                 setParties(
//                     (previous) =>
//                         previous.filter(
//                             (
//                                 _,
//                                 partyIndex
//                             ) =>
//                                 partyIndex !==
//                                 index
//                         )
//                 );

//                 Alert.alert(
//                     "Party Removed",
//                     "Party removed successfully."
//                 );
//             } catch (error: any) {
//                 console.error(
//                     "Delete Party Error:",
//                     error
//                 );

//                 if (
//                     error?.name ===
//                     "TypeError"
//                 ) {
//                     Alert.alert(
//                         "Server Error",
//                         "Server is down or there was a network error."
//                     );
//                 } else {
//                     Alert.alert(
//                         "Error",
//                         error?.message ||
//                         "Failed to delete party"
//                     );
//                 }
//             } finally {
//                 setRemovingIndex(
//                     null
//                 );
//             }
//         };


//     const confirmRemoveParty =
//         (index: number) => {
//             Alert.alert(
//                 "Remove Party",
//                 "Are you sure you want to remove this party?",
//                 [
//                     {
//                         text: "Cancel",
//                         style: "cancel",
//                     },
//                     {
//                         text: "Remove",
//                         style: "destructive",
//                         onPress: () =>
//                             removeParty(
//                                 index
//                             ),
//                     },
//                 ]
//             );
//         };


//     // ============================================================
//     // PROGRESS
//     // ============================================================

//     const getPartyStepStatus =
//         async (
//             party: Party
//         ): Promise<Progress> => {
//             if (!party._id) {
//                 return {
//                     completed: 0,
//                     total: 5,
//                     percent: 0,
//                     steps: [],
//                 };
//             }

//             try {
//                 const [
//                     fintracRes,
//                     pepRes,
//                     crgRes,
//                     docsRes,
//                 ] = await Promise.all([
//                     fetch(
//                         `${API_BASE}/fintracpdf/fintrac/user/${party._id}`
//                     ),
//                     fetch(
//                         `${API_BASE}/fintracpeppdf/pep/user/${party._id}`
//                     ),
//                     fetch(
//                         `${API_BASE}/crgpdf/crg/user/${party._id}`
//                     ),
//                     fetch(
//                         `${API_BASE}/statuspdf/document-status/pdf/${party._id}`
//                     ),
//                 ]);

//                 const [
//                     fintracData,
//                     pepData,
//                     crgData,
//                     docsData,
//                 ] = await Promise.all([
//                     fintracRes.json(),
//                     pepRes.json(),
//                     crgRes.json(),
//                     docsRes.json(),
//                 ]);

//                 let docCompletion = 0;

//                 if (docsData?.data) {
//                     const d =
//                         docsData.data;

//                     const buyerDocs = [
//                         d.EBRAA,
//                         d.EBRATDA,
//                         d.RPC,
//                         d.EBRADA,
//                     ];

//                     const sellerDocs = [
//                         d.SCSAAFA,
//                         d.IDMMGOL,
//                         d.ESRAA,
//                     ];

//                     const buyerCompletion =
//                         buyerDocs.filter(
//                             Boolean
//                         ).length /
//                         buyerDocs.length;

//                     const sellerCompletion =
//                         sellerDocs.filter(
//                             Boolean
//                         ).length /
//                         sellerDocs.length;

//                     if (
//                         buyerCompletion >
//                         0 ||
//                         sellerCompletion >
//                         0
//                     ) {
//                         docCompletion =
//                             Math.max(
//                                 buyerCompletion,
//                                 sellerCompletion
//                             );
//                     }
//                 }

//                 const steps = [
//                     !!(
//                         party.licenseImage ||
//                         party.passportImage
//                     ),
//                     !!fintracData?.data,
//                     !!pepData?.data,
//                     !!crgData?.data,
//                     docCompletion === 1,
//                 ];

//                 const completed =
//                     steps.filter(
//                         Boolean
//                     ).length;

//                 return {
//                     completed,
//                     total: steps.length,
//                     percent: Math.round(
//                         (completed /
//                             steps.length) *
//                         100
//                     ),
//                     steps,
//                 };
//             } catch (error) {
//                 console.error(
//                     "Step check error:",
//                     error
//                 );

//                 return {
//                     completed: 0,
//                     total: 5,
//                     percent: 0,
//                     steps: [],
//                 };
//             }
//         };


//     const refreshProgress =
//         useCallback(async () => {
//             const savedParties =
//                 parties.filter(
//                     (party) =>
//                         party._id
//                 );

//             if (
//                 !savedParties.length
//             ) {
//                 return;
//             }

//             const results =
//                 await Promise.all(
//                     savedParties.map(
//                         async (
//                             party
//                         ) => {
//                             const result =
//                                 await getPartyStepStatus(
//                                     party
//                                 );

//                             return {
//                                 id: party._id!,
//                                 result,
//                             };
//                         }
//                     )
//                 );

//             const newMap:
//                 Record<
//                     string,
//                     Progress
//                 > = {};

//             results.forEach(
//                 ({
//                     id,
//                     result,
//                 }) => {
//                     newMap[id] =
//                         result;
//                 }
//             );

//             setProgressMap(
//                 newMap
//             );
//         }, [parties]);


//     useEffect(() => {
//         refreshProgress();
//     }, [refreshProgress]);


//     // ============================================================
//     // SAVE PARTIES
//     // ============================================================

//     const handleNext =
//         async () => {
//             if (
//                 parties.some(
//                     (party) =>
//                         !party.name.trim() ||
//                         !party.email.trim()
//                 )
//             ) {
//                 Alert.alert(
//                     "Required Fields",
//                     "Please fill in the required Name and Email fields for every party."
//                 );

//                 return;
//             }

//             if (
//                 !transactionId ||
//                 !transactionUserId
//             ) {
//                 Alert.alert(
//                     "Transaction Not Found",
//                     "Please create or select a transaction first."
//                 );

//                 return;
//             }

//             setSaving(true);

//             try {
//                 const controller =
//                     new AbortController();

//                 const timeout = setTimeout(
//                     () => {
//                         controller.abort();
//                     },
//                     10000
//                 );

//                 try {
//                     const response =
//                         await fetch(
//                             `${API_BASE}/transactions/parties/save`,
//                             {
//                                 method: "POST",
//                                 headers: {
//                                     "Content-Type":
//                                         "application/json",
//                                 },
//                                 body: JSON.stringify(
//                                     {
//                                         transactionId,
//                                         userId:
//                                             transactionUserId,
//                                         parties:
//                                             parties.map(
//                                                 (
//                                                     party
//                                                 ) => ({
//                                                     _id:
//                                                         party._id,
//                                                     name:
//                                                         party.name.trim(),
//                                                     email:
//                                                         party.email.trim(),
//                                                     phone:
//                                                         party.phone.trim(),
//                                                     role:
//                                                         party.role,
//                                                 })
//                                             ),
//                                     }
//                                 ),
//                                 signal:
//                                     controller.signal,
//                             }
//                         );

//                     let data: any;

//                     try {
//                         data =
//                             await response.json();
//                     } catch {
//                         throw new Error(
//                             "Invalid server response"
//                         );
//                     }

//                     if (!response.ok) {
//                         throw new Error(
//                             data?.message ||
//                             `Error ${response.status}`
//                         );
//                     }

//                     if (!data?.success) {
//                         throw new Error(
//                             data?.message ||
//                             "Failed to save parties"
//                         );
//                     }

//                     Alert.alert(
//                         "Success",
//                         "Parties saved successfully."
//                     );

//                     await fetchParties();
//                     await refreshProgress();
//                 } finally {
//                     clearTimeout(
//                         timeout
//                     );
//                 }
//             } catch (error: any) {
//                 console.error(
//                     "Save Parties Error:",
//                     error
//                 );

//                 if (
//                     error?.name ===
//                     "AbortError"
//                 ) {
//                     Alert.alert(
//                         "Request Timed Out",
//                         "The server took too long to respond."
//                     );
//                 } else if (
//                     error?.name ===
//                     "TypeError"
//                 ) {
//                     Alert.alert(
//                         "Server Error",
//                         "Server is down or there was a network error."
//                     );
//                 } else {
//                     Alert.alert(
//                         "Error",
//                         error?.message ||
//                         "Server error"
//                     );
//                 }
//             } finally {
//                 setSaving(false);
//             }
//         };


//     // ============================================================
//     // DOCUMENT PICKER
//     // ============================================================

//     const handleFileChange =
//         async () => {
//             try {
//                 const result =
//                     await DocumentPicker.getDocumentAsync(
//                         {
//                             multiple: true,
//                             copyToCacheDirectory:
//                                 true,
//                         }
//                     );

//                 if (
//                     result.canceled
//                 ) {
//                     return;
//                 }

//                 setAttachments(
//                     (previous) => [
//                         ...previous,
//                         ...result.assets,
//                     ]
//                 );
//             } catch (error) {
//                 console.error(
//                     "Document picker error:",
//                     error
//                 );

//                 Alert.alert(
//                     "Error",
//                     "Unable to select files."
//                 );
//             }
//         };


//     const removeAttachment =
//         (index: number) => {
//             setAttachments(
//                 (previous) =>
//                     previous.filter(
//                         (
//                             _,
//                             attachmentIndex
//                         ) =>
//                             attachmentIndex !==
//                             index
//                     )
//             );
//         };


//     // ============================================================
//     // EMAIL RECIPIENT
//     // ============================================================

//     const toggleRecipient =
//         (email: string) => {
//             setEmailData(
//                 (previous) => {
//                     const exists =
//                         previous.to.includes(
//                             email
//                         );

//                     return {
//                         ...previous,
//                         to: exists
//                             ? previous.to.filter(
//                                 (
//                                     item
//                                 ) =>
//                                     item !==
//                                     email
//                             )
//                             : [
//                                 ...previous.to,
//                                 email,
//                             ],
//                     };
//                 }
//             );
//         };


//     const filteredParties =
//         useMemo(() => {
//             const search =
//                 searchEmail
//                     .trim()
//                     .toLowerCase();

//             if (!search) {
//                 return parties;
//             }

//             return parties.filter(
//                 (party) =>
//                     party.email
//                         .toLowerCase()
//                         .includes(
//                             search
//                         ) ||
//                     party.name
//                         .toLowerCase()
//                         .includes(
//                             search
//                         )
//             );
//         }, [
//             parties,
//             searchEmail,
//         ]);


//     // ============================================================
//     // SEND EMAIL
//     // ============================================================

//     const handleSendEmail =
//         async () => {
//             if (
//                 emailData.to.length ===
//                 0
//             ) {
//                 Alert.alert(
//                     "Recipients Required",
//                     "Please select at least one recipient."
//                 );

//                 return;
//             }

//             if (!transactionId) {
//                 Alert.alert(
//                     "Transaction Not Found",
//                     "Please create a transaction first."
//                 );

//                 return;
//             }

//             try {
//                 const formData =
//                     new FormData();

//                 formData.append(
//                     "subject",
//                     emailData.subject
//                 );

//                 formData.append(
//                     "message",
//                     emailData.message
//                 );

//                 formData.append(
//                     "transactionId",
//                     transactionId
//                 );

//                 emailData.to.forEach(
//                     (email) => {
//                         formData.append(
//                             "to",
//                             email
//                         );
//                     }
//                 );

//                 attachments.forEach(
//                     (file) => {
//                         if (!file.uri) {
//                             return;
//                         }

//                         formData.append(
//                             "attachments",
//                             {
//                                 uri: file.uri,
//                                 name:
//                                     file.name ||
//                                     `attachment-${Date.now()}`,
//                                 type:
//                                     file.mimeType ||
//                                     "application/octet-stream",
//                             } as any
//                         );
//                     }
//                 );

//                 const response =
//                     await fetch(
//                         `${API_BASE}/transactions/parties/send-email`,
//                         {
//                             method: "POST",
//                             body: formData,
//                         }
//                     );

//                 let data: any;

//                 try {
//                     data =
//                         await response.json();
//                 } catch {
//                     throw new Error(
//                         "Invalid server response"
//                     );
//                 }

//                 if (
//                     !response.ok ||
//                     !data?.success
//                 ) {
//                     throw new Error(
//                         data?.message ||
//                         "Failed to send email"
//                     );
//                 }

//                 Alert.alert(
//                     "Email Sent",
//                     "Email sent successfully."
//                 );

//                 setShowEmailModal(
//                     false
//                 );

//                 setEmailData({
//                     to: [],
//                     subject: "",
//                     message: "",
//                 });

//                 setSearchEmail("");
//                 setAttachments([]);
//                 setShowRecipientList(
//                     false
//                 );
//             } catch (error: any) {
//                 console.error(
//                     "Send Email Error:",
//                     error
//                 );

//                 Alert.alert(
//                     "Email Error",
//                     error?.message ||
//                     "Failed to send email"
//                 );
//             }
//         };


//     // ============================================================
//     // PARTY CARD TOGGLE
//     // ============================================================

//     const toggleParty = (
//         index: number
//     ) => {
//         setExpandedParties(
//             (previous) => ({
//                 ...previous,
//                 [index]:
//                     !(
//                         previous[index] ??
//                         true
//                     ),
//             })
//         );
//     };


//     // ============================================================
//     // LOADING
//     // ============================================================

//     if (
//         authLoading ||
//         resolvingTransactionUser ||
//         loading
//     ) {
//         return (
//             <View className="flex-1 items-center justify-center bg-gray-50">
//                 <ActivityIndicator
//                     size="large"
//                     color="#9a6a3a"
//                 />

//                 <Text className="mt-4 text-sm text-gray-500">
//                     Loading parties...
//                 </Text>
//             </View>
//         );
//     }


//     // ============================================================
//     // UI
//     // ============================================================

//     return (
//         <>
//             <Stack.Screen
//                 options={{
//                     title: "Add Parties",
//                 }}
//             />

//             <KeyboardAvoidingView
//                 className="flex-1 bg-gray-50"
//                 behavior={
//                     Platform.OS === "ios"
//                         ? "padding"
//                         : undefined
//                 }
//             >
//                 <ScrollView
//                     keyboardShouldPersistTaps="handled"
//                     showsVerticalScrollIndicator={
//                         false
//                     }
//                     contentContainerStyle={{
//                         paddingHorizontal: 16,
//                         paddingTop: 20,
//                         paddingBottom: 40,
//                     }}
//                 >

//                     {/* ==================================================
//                         HEADER
//                     ================================================== */}

//                     <View className="mb-6">
//                         <View className="flex-row items-center">

//                             {/* <Pressable
//                                 onPress={() =>
//                                     router.back()
//                                 }
//                                 className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-white"
//                             >
//                                 <ArrowLeft
//                                     size={20}
//                                     color="#374151"
//                                 />
//                             </Pressable> */}

//                             <View className="flex-1">

//                                 <Text className="text-2xl font-bold text-gray-800">
//                                     Add Parties
//                                 </Text>

//                                 <Text className="mt-1 text-sm text-gray-500">
//                                     You can add up to 4 parties to this transaction.
//                                 </Text>

//                             </View>

//                         </View>


//                         {/* SEND EMAIL */}

//                         <Pressable
//                             onPress={() =>
//                                 setShowEmailModal(
//                                     true
//                                 )
//                             }
//                             className="mt-5 h-12 flex-row items-center justify-center rounded-2xl bg-[#9a6a3a]"
//                             style={({
//                                 pressed,
//                             }) => ({
//                                 opacity:
//                                     pressed
//                                         ? 0.85
//                                         : 1,
//                             })}
//                         >
//                             <Mail
//                                 size={19}
//                                 color="#ffffff"
//                             />

//                             <Text className="ml-2 text-sm font-semibold text-white">
//                                 Send Email
//                             </Text>
//                         </Pressable>

//                     </View>


//                     {/* ==================================================
//                         PARTY LIST
//                     ================================================== */}

//                     <View className="gap-5">

//                         {parties.map(
//                             (
//                                 party,
//                                 index
//                             ) => {

//                                 const progress =
//                                     party._id
//                                         ? progressMap[
//                                             party._id
//                                         ]
//                                         : undefined;

//                                 const currentProgress =
//                                     progress || {
//                                         completed: 0,
//                                         total: 5,
//                                         percent: 0,
//                                         steps: [],
//                                     };

//                                 const expanded =
//                                     expandedParties[
//                                         index
//                                     ] ??
//                                     true;

//                                 const isRemoving =
//                                     removingIndex ===
//                                     index;

//                                 return (
//                                     <View
//                                         key={
//                                             party._id ||
//                                             `party-${index}`
//                                         }
//                                         className="overflow-hidden rounded-3xl border border-gray-200 bg-white"
//                                     >

//                                         {/* PARTY HEADER */}

//                                         <View className="border-b border-gray-100 px-5 py-4">

//                                             <View className="flex-row items-center">

//                                                 <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#9a6a3a]/10">

//                                                     <Text className="text-base font-bold text-[#9a6a3a]">
//                                                         {index +
//                                                             1}
//                                                     </Text>

//                                                 </View>

//                                                 <View className="ml-3 flex-1">

//                                                     <Text className="text-lg font-semibold text-gray-800">
//                                                         Party{" "}
//                                                         {index +
//                                                             1}
//                                                     </Text>

//                                                     <Text className="mt-0.5 text-xs text-gray-500">
//                                                         Buyer/Seller information
//                                                     </Text>

//                                                 </View>

//                                                 <Pressable
//                                                     onPress={() =>
//                                                         toggleParty(
//                                                             index
//                                                         )
//                                                     }
//                                                     className="h-10 w-10 items-center justify-center rounded-xl bg-gray-50"
//                                                 >
//                                                     {expanded ? (
//                                                         <ChevronUp
//                                                             size={
//                                                                 20
//                                                             }
//                                                             color="#6b7280"
//                                                         />
//                                                     ) : (
//                                                         <ChevronDown
//                                                             size={
//                                                                 20
//                                                             }
//                                                             color="#6b7280"
//                                                         />
//                                                     )}
//                                                 </Pressable>

//                                             </View>


//                                             {/* ACTIONS */}

//                                             <View className="mt-4 flex-row gap-3">

//                                                 {party._id && (
//                                                     <Pressable
//                                                         onPress={() =>
//                                                             router.push(
//                                                                 `/(transactions)/partypdfdata/${party._id}` as any
//                                                             )
//                                                         }
//                                                         className="h-11 flex-1 flex-row items-center justify-center rounded-xl border border-gray-200"
//                                                     >

//                                                         <FileText
//                                                             size={
//                                                                 17
//                                                             }
//                                                             color="#4b5563"
//                                                         />

//                                                         <Text className="ml-2 text-sm font-medium text-gray-600">
//                                                             See Docs
//                                                         </Text>

//                                                     </Pressable>
//                                                 )}


//                                                 {parties.length >
//                                                     1 && (
//                                                     <Pressable
//                                                         disabled={
//                                                             isRemoving
//                                                         }
//                                                         onPress={() =>
//                                                             confirmRemoveParty(
//                                                                 index
//                                                             )
//                                                         }
//                                                         className="h-11 w-11 items-center justify-center rounded-xl bg-red-50"
//                                                     >

//                                                         {isRemoving ? (
//                                                             <ActivityIndicator
//                                                                 size="small"
//                                                                 color="#ef4444"
//                                                             />
//                                                         ) : (
//                                                             <Trash2
//                                                                 size={
//                                                                     18
//                                                                 }
//                                                                 color="#ef4444"
//                                                             />
//                                                         )}

//                                                     </Pressable>
//                                                 )}

//                                             </View>

//                                         </View>


//                                         {/* PARTY BODY */}

//                                         {expanded && (
//                                             <View className="p-5">

//                                                 {/* FULL NAME */}

//                                                 <View className="mb-5">

//                                                     <Text className="mb-2 text-sm font-medium text-gray-600">
//                                                         Full Name
//                                                         <Text className="text-red-500">
//                                                             {" "}
//                                                             *
//                                                         </Text>
//                                                     </Text>

//                                                     <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">

//                                                         <User
//                                                             size={
//                                                                 18
//                                                             }
//                                                             color="#9ca3af"
//                                                         />

//                                                         <TextInput
//                                                             value={
//                                                                 party.name
//                                                             }
//                                                             onChangeText={(
//                                                                 value
//                                                             ) =>
//                                                                 updateParty(
//                                                                     index,
//                                                                     "name",
//                                                                     value
//                                                                 )
//                                                             }
//                                                             placeholder="Enter full name"
//                                                             placeholderTextColor="#9ca3af"
//                                                             autoCapitalize="words"
//                                                             className="ml-3 flex-1 py-3.5 text-base text-gray-800"
//                                                         />

//                                                     </View>

//                                                 </View>


//                                                 {/* EMAIL */}

//                                                 <View className="mb-5">

//                                                     <Text className="mb-2 text-sm font-medium text-gray-600">
//                                                         Email
//                                                         <Text className="text-red-500">
//                                                             {" "}
//                                                             *
//                                                         </Text>
//                                                     </Text>

//                                                     <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">

//                                                         <Mail
//                                                             size={
//                                                                 18
//                                                             }
//                                                             color="#9ca3af"
//                                                         />

//                                                         <TextInput
//                                                             value={
//                                                                 party.email
//                                                             }
//                                                             onChangeText={(
//                                                                 value
//                                                             ) =>
//                                                                 updateParty(
//                                                                     index,
//                                                                     "email",
//                                                                     value
//                                                                 )
//                                                             }
//                                                             placeholder="Enter email address"
//                                                             placeholderTextColor="#9ca3af"
//                                                             keyboardType="email-address"
//                                                             autoCapitalize="none"
//                                                             autoCorrect={
//                                                                 false
//                                                             }
//                                                             className="ml-3 flex-1 py-3.5 text-base text-gray-800"
//                                                         />

//                                                     </View>

//                                                 </View>


//                                                 {/* PHONE */}

//                                                 <View className="mb-5">

//                                                     <Text className="mb-2 text-sm font-medium text-gray-600">
//                                                         Phone
//                                                     </Text>

//                                                     <TextInput
//                                                         value={
//                                                             party.phone
//                                                         }
//                                                         onChangeText={(
//                                                             value
//                                                         ) =>
//                                                             updateParty(
//                                                                 index,
//                                                                 "phone",
//                                                                 value
//                                                             )
//                                                         }
//                                                         placeholder="Enter phone number"
//                                                         placeholderTextColor="#9ca3af"
//                                                         keyboardType="phone-pad"
//                                                         className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-800"
//                                                     />

//                                                 </View>


//                                                 {/* ROLE */}

//                                                 <View className="mb-5">

//                                                     <Text className="mb-2 text-sm font-medium text-gray-600">
//                                                         Role
//                                                     </Text>

//                                                     <View className="flex-row flex-wrap gap-2">

//                                                         {ROLES.map(
//                                                             (
//                                                                 role
//                                                             ) => {

//                                                                 const selected =
//                                                                     party.role ===
//                                                                     role;

//                                                                 return (
//                                                                     <Pressable
//                                                                         key={
//                                                                             role
//                                                                         }
//                                                                         onPress={() =>
//                                                                             updateParty(
//                                                                                 index,
//                                                                                 "role",
//                                                                                 role
//                                                                             )
//                                                                         }
//                                                                         className={`rounded-xl px-4 py-2.5 ${
//                                                                             selected
//                                                                                 ? "bg-[#9a6a3a]"
//                                                                                 : "bg-gray-100"
//                                                                         }`}
//                                                                     >

//                                                                         <Text
//                                                                             className={`text-sm font-semibold ${
//                                                                                 selected
//                                                                                     ? "text-white"
//                                                                                     : "text-gray-600"
//                                                                             }`}
//                                                                         >
//                                                                             {
//                                                                                 role
//                                                                             }
//                                                                         </Text>

//                                                                     </Pressable>
//                                                                 );
//                                                             }
//                                                         )}

//                                                     </View>

//                                                 </View>


//                                                 {/* UPLOADED DOCUMENTS */}

//                                                 {(party.licenseImage ||
//                                                     party.passportImage) && (
//                                                     <View className="mb-6">

//                                                         <Text className="mb-3 text-sm font-semibold text-gray-700">
//                                                             Uploaded Documents
//                                                         </Text>

//                                                         <View className="gap-4">

//                                                             {party.licenseImage && (
//                                                                 <View className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-3">

//                                                                     <Text className="mb-2 text-xs font-medium text-gray-500">
//                                                                         Driving License
//                                                                     </Text>

//                                                                     <Image
//                                                                         source={{
//                                                                             uri: party.licenseImage,
//                                                                         }}
//                                                                         className="h-44 w-full rounded-xl"
//                                                                         resizeMode="cover"
//                                                                     />

//                                                                 </View>
//                                                             )}


//                                                             {party.passportImage && (
//                                                                 <View className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-3">

//                                                                     <Text className="mb-2 text-xs font-medium text-gray-500">
//                                                                         Passport
//                                                                     </Text>

//                                                                     <Image
//                                                                         source={{
//                                                                             uri: party.passportImage,
//                                                                         }}
//                                                                         className="h-44 w-full rounded-xl"
//                                                                         resizeMode="cover"
//                                                                     />

//                                                                 </View>
//                                                             )}

//                                                         </View>

//                                                     </View>
//                                                 )}


//                                                 {/* PROGRESS */}

//                                                 <View className="rounded-3xl border border-gray-200 bg-gray-50/70 p-5">

//                                                     <View className="flex-row items-start justify-between">

//                                                         <View className="flex-1">

//                                                             <Text className="text-base font-semibold text-gray-800">
//                                                                 Completion Progress
//                                                             </Text>

//                                                             <Text className="mt-1 text-sm text-gray-500">
//                                                                 {
//                                                                     currentProgress.completed
//                                                                 }{" "}
//                                                                 of{" "}
//                                                                 {
//                                                                     currentProgress.total
//                                                                 }{" "}
//                                                                 steps completed
//                                                             </Text>

//                                                         </View>

//                                                         <Text className="text-xl font-bold text-[#9a6a3a]">
//                                                             {
//                                                                 currentProgress.percent
//                                                             }
//                                                             %
//                                                         </Text>

//                                                     </View>


//                                                     {/* PROGRESS BAR */}

//                                                     <View className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200">

//                                                         <View
//                                                             className="h-full rounded-full bg-[#9a6a3a]"
//                                                             style={{
//                                                                 width: `${currentProgress.percent}%`,
//                                                             }}
//                                                         />

//                                                     </View>


//                                                     {/* STEPS */}

//                                                     <View className="mt-6">

//                                                         {PARTY_STEPS.map(
//                                                             (
//                                                                 step,
//                                                                 stepIndex
//                                                             ) => {

//                                                                 const isDone =
//                                                                     currentProgress
//                                                                         .steps[
//                                                                     stepIndex
//                                                                     ];

//                                                                 const isCurrent =
//                                                                     !isDone &&
//                                                                     stepIndex ===
//                                                                     currentProgress.completed;

//                                                                 return (
//                                                                     <View
//                                                                         key={
//                                                                             step
//                                                                         }
//                                                                         className="mb-4 flex-row items-center"
//                                                                     >

//                                                                         <View
//                                                                             className={`h-9 w-9 items-center justify-center rounded-full ${
//                                                                                 isDone
//                                                                                     ? "bg-green-500"
//                                                                                     : isCurrent
//                                                                                         ? "bg-yellow-400"
//                                                                                         : "border border-gray-300 bg-white"
//                                                                             }`}
//                                                                         >

//                                                                             {isDone ? (
//                                                                                 <Check
//                                                                                     size={
//                                                                                         17
//                                                                                     }
//                                                                                     color="#ffffff"
//                                                                                 />
//                                                                             ) : (
//                                                                                 <Text
//                                                                                     className={`text-xs font-bold ${
//                                                                                         isCurrent
//                                                                                             ? "text-white"
//                                                                                             : "text-gray-400"
//                                                                                     }`}
//                                                                                 >
//                                                                                     {stepIndex +
//                                                                                         1}
//                                                                                 </Text>
//                                                                             )}

//                                                                         </View>


//                                                                         <View className="ml-3 flex-1">

//                                                                             <Text
//                                                                                 className={`text-sm font-medium ${
//                                                                                     isDone
//                                                                                         ? "text-green-600"
//                                                                                         : isCurrent
//                                                                                             ? "text-yellow-600"
//                                                                                             : "text-gray-400"
//                                                                                 }`}
//                                                                             >
//                                                                                 {
//                                                                                     step
//                                                                                 }
//                                                                             </Text>

//                                                                             <Text className="mt-0.5 text-xs text-gray-400">
//                                                                                 {isDone
//                                                                                     ? "Completed"
//                                                                                     : isCurrent
//                                                                                         ? "Current step"
//                                                                                         : "Not completed"}
//                                                                             </Text>

//                                                                         </View>

//                                                                     </View>
//                                                                 );
//                                                             }
//                                                         )}

//                                                     </View>

//                                                 </View>

//                                             </View>
//                                         )}

//                                     </View>
//                                 );
//                             }
//                         )}

//                     </View>


//                     {/* ==================================================
//                         ADD PARTY
//                     ================================================== */}

//                     {parties.length <
//                         4 && (
//                         <Pressable
//                             onPress={
//                                 addParty
//                             }
//                             className="mt-5 h-14 flex-row items-center justify-center rounded-2xl border border-dashed border-[#9a6a3a]"
//                             style={({
//                                 pressed,
//                             }) => ({
//                                 opacity:
//                                     pressed
//                                         ? 0.7
//                                         : 1,
//                             })}
//                         >

//                             <Plus
//                                 size={
//                                     20
//                                 }
//                                 color="#9a6a3a"
//                             />

//                             <Text className="ml-2 text-sm font-semibold text-[#9a6a3a]">
//                                 Add Party
//                             </Text>

//                         </Pressable>
//                     )}


//                     {/* ==================================================
//                         FOOTER
//                     ================================================== */}

//                     <View className="mt-6 border-t border-gray-200 pt-5">

//                         <Pressable
//                             onPress={() =>
//                                 router.replace(
//                                     "/(transactions)/new-transaction" as any
//                                 )
//                             }
//                             className="mb-3 h-14 items-center justify-center rounded-2xl border border-gray-200 bg-white"
//                         >
//                             <Text className="text-sm font-semibold text-gray-600">
//                                 Back
//                             </Text>
//                         </Pressable>


//                         <Pressable
//                             onPress={
//                                 handleNext
//                             }
//                             disabled={
//                                 saving
//                             }
//                             className="h-14 flex-row items-center justify-center rounded-2xl bg-[#9a6a3a]"
//                             style={({
//                                 pressed,
//                             }) => ({
//                                 opacity:
//                                     saving
//                                         ? 0.6
//                                         : pressed
//                                             ? 0.85
//                                             : 1,
//                             })}
//                         >

//                             {saving ? (
//                                 <ActivityIndicator
//                                     size="small"
//                                     color="#ffffff"
//                                 />
//                             ) : (
//                                 <Send
//                                     size={
//                                         18
//                                     }
//                                     color="#ffffff"
//                                 />
//                             )}

//                             <Text className="ml-2 text-sm font-semibold text-white">
//                                 {saving
//                                     ? "Saving..."
//                                     : "Add Parties & Send E-Mail"}
//                             </Text>

//                         </Pressable>

//                     </View>

//                 </ScrollView>
//             </KeyboardAvoidingView>


//             {/* ============================================================
//                 EMAIL MODAL
//             ============================================================ */}

//             <Modal
//                 visible={
//                     showEmailModal
//                 }
//                 animationType="slide"
//                 transparent
//                 onRequestClose={() =>
//                     setShowEmailModal(
//                         false
//                     )
//                 }
//             >

//                 <View className="flex-1 justify-end bg-black/50">

//                     <KeyboardAvoidingView
//                         className="max-h-[92%]"
//                         behavior={
//                             Platform.OS ===
//                             "ios"
//                                 ? "padding"
//                                 : undefined
//                         }
//                     >

//                         <View className="rounded-t-3xl bg-white">

//                             {/* MODAL HEADER */}

//                             <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-5">

//                                 <View className="flex-1">

//                                     <Text className="text-xl font-bold text-gray-800">
//                                         New Message
//                                     </Text>

//                                     <Text className="mt-1 text-sm text-gray-500">
//                                         Send email to selected parties
//                                     </Text>

//                                 </View>

//                                 <Pressable
//                                     onPress={() =>
//                                         setShowEmailModal(
//                                             false
//                                         )
//                                     }
//                                     className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100"
//                                 >
//                                     <X
//                                         size={
//                                             20
//                                         }
//                                         color="#374151"
//                                     />
//                                 </Pressable>

//                             </View>


//                             <ScrollView
//                                 keyboardShouldPersistTaps="handled"
//                                 showsVerticalScrollIndicator={
//                                     false
//                                 }
//                                 contentContainerStyle={{
//                                     padding: 20,
//                                     paddingBottom: 30,
//                                 }}
//                             >

//                                 {/* TO */}

//                                 <View className="mb-5">

//                                     <Text className="mb-2 text-sm font-medium text-gray-600">
//                                         To
//                                     </Text>

//                                     <Pressable
//                                         onPress={() =>
//                                             setShowRecipientList(
//                                                 (
//                                                     previous
//                                                 ) =>
//                                                     !previous
//                                             )
//                                         }
//                                         className="min-h-[56px] flex-row flex-wrap items-center rounded-2xl border border-gray-200 bg-gray-50 p-3"
//                                     >

//                                         {emailData
//                                             .to
//                                             .length ===
//                                             0 ? (

//                                             <Text className="flex-1 text-sm text-gray-400">
//                                                 Select recipients...
//                                             </Text>

//                                         ) : (

//                                             <View className="flex-1 flex-row flex-wrap gap-2">

//                                                 {emailData.to.map(
//                                                     (
//                                                         email
//                                                     ) => (

//                                                         <Pressable
//                                                             key={
//                                                                 email
//                                                             }
//                                                             onPress={() =>
//                                                                 toggleRecipient(
//                                                                     email
//                                                                 )
//                                                             }
//                                                             className="flex-row items-center rounded-xl bg-[#9a6a3a]/10 px-3 py-2"
//                                                         >

//                                                             <Text
//                                                                 numberOfLines={
//                                                                     1
//                                                                 }
//                                                                 className="max-w-[230px] text-xs font-medium text-[#9a6a3a]"
//                                                             >
//                                                                 {
//                                                                     email
//                                                                 }
//                                                             </Text>

//                                                             <X
//                                                                 size={
//                                                                     14
//                                                                 }
//                                                                 color="#9a6a3a"
//                                                                 style={{
//                                                                     marginLeft:
//                                                                         5,
//                                                                 }}
//                                                             />

//                                                         </Pressable>

//                                                     )
//                                                 )}

//                                             </View>

//                                         )}

//                                         <ChevronDown
//                                             size={
//                                                 18
//                                             }
//                                             color="#9ca3af"
//                                         />

//                                     </Pressable>


//                                     {/* RECIPIENT LIST */}

//                                     {showRecipientList && (
//                                         <View className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white">

//                                             <View className="border-b border-gray-100 px-3 py-2">

//                                                 <TextInput
//                                                     value={
//                                                         searchEmail
//                                                     }
//                                                     onChangeText={
//                                                         setSearchEmail
//                                                     }
//                                                     placeholder="Search name or email..."
//                                                     placeholderTextColor="#9ca3af"
//                                                     autoCapitalize="none"
//                                                     className="py-2 text-sm text-gray-700"
//                                                 />

//                                             </View>


//                                             {filteredParties
//                                                 .filter(
//                                                     (
//                                                         party
//                                                     ) =>
//                                                         !emailData.to.includes(
//                                                             party.email
//                                                         )
//                                                 )
//                                                 .map(
//                                                     (
//                                                         party
//                                                     ) => (

//                                                         <Pressable
//                                                             key={
//                                                                 party._id ||
//                                                                 party.email
//                                                             }
//                                                             onPress={() =>
//                                                                 toggleRecipient(
//                                                                     party.email
//                                                                 )
//                                                             }
//                                                             className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3"
//                                                         >

//                                                             <View className="mr-3 flex-1">

//                                                                 <Text className="text-sm font-medium text-gray-700">
//                                                                     {party.name ||
//                                                                         "Unnamed Party"}
//                                                                 </Text>

//                                                                 <Text className="mt-1 text-xs text-gray-400">
//                                                                     {
//                                                                         party.email
//                                                                     }
//                                                                 </Text>

//                                                             </View>

//                                                             <Text className="text-xs font-medium text-gray-400">
//                                                                 {
//                                                                     party.role
//                                                                 }
//                                                             </Text>

//                                                         </Pressable>

//                                                     )
//                                                 )}


//                                             {filteredParties.filter(
//                                                 (
//                                                     party
//                                                 ) =>
//                                                     !emailData.to.includes(
//                                                         party.email
//                                                     )
//                                             ).length ===
//                                                 0 && (

//                                                     <Text className="px-4 py-4 text-center text-sm text-gray-400">
//                                                         No recipients found
//                                                     </Text>

//                                                 )}

//                                         </View>
//                                     )}

//                                 </View>


//                                 {/* SUBJECT */}

//                                 <View className="mb-5">

//                                     <Text className="mb-2 text-sm font-medium text-gray-600">
//                                         Subject
//                                     </Text>

//                                     <TextInput
//                                         value={
//                                             emailData.subject
//                                         }
//                                         onChangeText={(
//                                             value
//                                         ) =>
//                                             setEmailData(
//                                                 (
//                                                     previous
//                                                 ) => ({
//                                                     ...previous,
//                                                     subject:
//                                                         value,
//                                                 })
//                                             )
//                                         }
//                                         placeholder="Enter subject..."
//                                         placeholderTextColor="#9ca3af"
//                                         className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-800"
//                                     />

//                                 </View>


//                                 {/* MESSAGE */}

//                                 <View className="mb-5">

//                                     <Text className="mb-2 text-sm font-medium text-gray-600">
//                                         Message
//                                     </Text>

//                                     <TextInput
//                                         value={
//                                             emailData.message
//                                         }
//                                         onChangeText={(
//                                             value
//                                         ) =>
//                                             setEmailData(
//                                                 (
//                                                     previous
//                                                 ) => ({
//                                                     ...previous,
//                                                     message:
//                                                         value,
//                                                 })
//                                             )
//                                         }
//                                         placeholder="Write your message..."
//                                         placeholderTextColor="#9ca3af"
//                                         multiline
//                                         numberOfLines={
//                                             7
//                                         }
//                                         textAlignVertical="top"
//                                         className="min-h-[160px] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base leading-6 text-gray-800"
//                                     />

//                                 </View>


//                                 {/* ATTACHMENTS */}

//                                 <View>

//                                     <Text className="mb-3 text-sm font-medium text-gray-600">
//                                         Attachments
//                                     </Text>

//                                     <Pressable
//                                         onPress={
//                                             handleFileChange
//                                         }
//                                         className="h-12 flex-row items-center justify-center rounded-2xl border border-gray-200 bg-white"
//                                     >

//                                         <Paperclip
//                                             size={
//                                                 18
//                                             }
//                                             color="#4b5563"
//                                         />

//                                         <Text className="ml-2 text-sm font-medium text-gray-600">
//                                             Add Files
//                                         </Text>

//                                     </Pressable>


//                                     {attachments.length >
//                                         0 && (

//                                         <View className="mt-4 gap-2">

//                                             {attachments.map(
//                                                 (
//                                                     file,
//                                                     index
//                                                 ) => (

//                                                     <View
//                                                         key={`${file.uri}-${index}`}
//                                                         className="flex-row items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
//                                                     >

//                                                         <FileText
//                                                             size={
//                                                                 17
//                                                             }
//                                                             color="#9ca3af"
//                                                         />

//                                                         <Text
//                                                             numberOfLines={
//                                                                 1
//                                                             }
//                                                             className="ml-3 flex-1 text-sm text-gray-700"
//                                                         >
//                                                             {
//                                                                 file.name
//                                                             }
//                                                         </Text>

//                                                         <Pressable
//                                                             onPress={() =>
//                                                                 removeAttachment(
//                                                                     index
//                                                                 )
//                                                             }
//                                                         >

//                                                             <X
//                                                                 size={
//                                                                     18
//                                                                 }
//                                                                 color="#ef4444"
//                                                             />

//                                                         </Pressable>

//                                                     </View>

//                                                 )
//                                             )}

//                                         </View>

//                                     )}

//                                 </View>

//                             </ScrollView>


//                             {/* MODAL FOOTER */}

//                             <View className="border-t border-gray-100 px-5 py-4">

//                                 <View className="flex-row gap-3">

//                                     <Pressable
//                                         onPress={() =>
//                                             setShowEmailModal(
//                                                 false
//                                             )
//                                         }
//                                         className="h-12 flex-1 items-center justify-center rounded-2xl border border-gray-200"
//                                     >

//                                         <Text className="text-sm font-semibold text-gray-600">
//                                             Cancel
//                                         </Text>

//                                     </Pressable>


//                                     <Pressable
//                                         onPress={
//                                             handleSendEmail
//                                         }
//                                         className="h-12 flex-1 flex-row items-center justify-center rounded-2xl bg-[#9a6a3a]"
//                                     >

//                                         <Send
//                                             size={
//                                                 17
//                                             }
//                                             color="#ffffff"
//                                         />

//                                         <Text className="ml-2 text-sm font-semibold text-white">
//                                             Send Email
//                                         </Text>

//                                     </Pressable>

//                                 </View>

//                             </View>

//                         </View>

//                     </KeyboardAvoidingView>

//                 </View>

//             </Modal>
//         </>
//     );
// }