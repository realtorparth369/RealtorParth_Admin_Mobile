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

import { useState } from "react";

import { useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import axios from "axios";

import * as DocumentPicker from "expo-document-picker";

/* =========================================================
   API
========================================================= */

const API_URL = "https://realtorparth.ca";

/* =========================================================
   SELECTED FILE TYPE
========================================================= */

type SelectedFile = {
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
};

/* =========================================================
   SCREEN
========================================================= */

export default function NewResourceScreen() {
    const router = useRouter();

    /* =====================================================
       STATE
    ===================================================== */

    const [title, setTitle] = useState("");

    const [file, setFile] =
        useState<SelectedFile | null>(null);

    const [saving, setSaving] =
        useState(false);

    /* =====================================================
       BACK
    ===================================================== */

    const handleBack = () => {
        if (saving) {
            return;
        }

        router.push(
            "/resources"
        );
    };

    /* =====================================================
       PICK PDF
    ===================================================== */

    const handlePickFile = async () => {
        if (saving) {
            return;
        }

        try {
            const result =
                await DocumentPicker.getDocumentAsync({
                    type: "application/pdf",
                    copyToCacheDirectory: true,
                    multiple: false,
                });

            if (result.canceled) {
                return;
            }

            const selected =
                result.assets?.[0];

            if (!selected) {
                return;
            }

            console.log(
                "Selected resource file:",
                selected
            );

            setFile({
                uri: selected.uri,
                name:
                    selected.name ||
                    "resource.pdf",
                mimeType:
                    selected.mimeType ||
                    "application/pdf",
                size: selected.size,
            });
        } catch (error) {
            console.error(
                "File picker failed:",
                error
            );

            Alert.alert(
                "Error",
                "Unable to select the PDF file."
            );
        }
    };

    /* =====================================================
       REMOVE FILE
    ===================================================== */

    const handleRemoveFile = () => {
        if (saving) {
            return;
        }

        setFile(null);
    };

    /* =====================================================
       UPLOAD
    ===================================================== */

    const handleUpload = async () => {
        /* -------------------------------------------------
           VALIDATION
        ------------------------------------------------- */

        if (!title.trim()) {
            Alert.alert(
                "Validation",
                "Please enter a resource title."
            );

            return;
        }

        if (!file) {
            Alert.alert(
                "Validation",
                "Please select a PDF file."
            );

            return;
        }

        /* -------------------------------------------------
           CHECK FILE TYPE
        ------------------------------------------------- */

        const isPdf =
            file.mimeType ===
                "application/pdf" ||
            file.name
                .toLowerCase()
                .endsWith(".pdf");

        if (!isPdf) {
            Alert.alert(
                "Invalid File",
                "Please select a PDF file only."
            );

            return;
        }

        /* -------------------------------------------------
           SAVE
        ------------------------------------------------- */

        try {
            setSaving(true);

            // console.log(
            //     "===================================="
            // );

            // console.log(
            //     "Uploading resource"
            // );

            // console.log(
            //     "Title:",
            //     title.trim()
            // );

            // console.log(
            //     "File:",
            //     file.name
            // );

            // console.log(
            //     "===================================="
            // );

            /* ---------------------------------------------
               FORM DATA
            --------------------------------------------- */

            const formData =
                new FormData();

            formData.append(
                "title",
                title.trim()
            );

            /*
             * React Native FormData file
             */

            formData.append(
                "file",
                {
                    uri: file.uri,
                    name: file.name,
                    type:
                        file.mimeType ||
                        "application/pdf",
                } as any
            );

            /* ---------------------------------------------
               API
            --------------------------------------------- */

            const response =
                await axios.post(
                    `${API_URL}/api/resources/upload`,
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data",
                        },
                    }
                );

            // console.log(
            //     "Upload response:",
            //     response.data
            // );

            /* ---------------------------------------------
               SUCCESS
            --------------------------------------------- */

            Alert.alert(
                "Success",
                "Resource uploaded successfully.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.push(
                                "/resources"
                            );
                        },
                    },
                ]
            );
        } catch (error: any) {
            // console.error(
            //     "===================================="
            // );

            // console.error(
            //     "RESOURCE UPLOAD FAILED"
            // );

            // console.error(
            //     "Status:",
            //     error?.response?.status
            // );

            // console.error(
            //     "Response:",
            //     error?.response?.data
            // );

            // console.error(
            //     "Message:",
            //     error?.message
            // );

            // console.error(
            //     "===================================="
            // );

            const serverError =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "";

            Alert.alert(
                "Upload Failed",
                serverError ||
                    "Failed to upload resource."
            );
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       FORMAT FILE SIZE
    ===================================================== */

    const formatFileSize = (
        bytes?: number
    ) => {
        if (!bytes) {
            return "";
        }

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(
                bytes / 1024
            ).toFixed(1)} KB`;
        }

        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    };

    /* =====================================================
       UI
    ===================================================== */

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-100"
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : "height"
            }
        >
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: 60,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* =================================================
                    HEADER
                ================================================= */}

                <View className="flex-row items-center">
                    <Pressable
                        onPress={handleBack}
                        disabled={saving}
                        className="mr-3 rounded-xl bg-white p-3"
                    >
                        <Ionicons
                            name="arrow-back"
                            size={21}
                            color="#374151"
                        />
                    </Pressable>

                    <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900">
                            New Resource
                        </Text>

                        <Text className="text-sm text-gray-500">
                            Upload a downloadable PDF resource
                        </Text>
                    </View>
                </View>

                {/* =================================================
                    RESOURCE INFORMATION
                ================================================= */}

                <View className="mt-6 rounded-2xl bg-white p-5">
                    <Text className="text-lg font-bold text-gray-900">
                        Resource Information
                    </Text>

                    {/* ---------------------------------------------
                        TITLE
                    --------------------------------------------- */}

                    <View className="mt-5">
                        <Text className="mb-2 font-semibold text-gray-800">
                            Resource Title
                        </Text>

                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Enter resource title"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="sentences"
                            autoCorrect
                            editable={!saving}
                            className="min-h-[50px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
                        />
                    </View>

                    {/* ---------------------------------------------
                        FILE
                    --------------------------------------------- */}

                    <View className="mt-6">
                        <Text className="mb-2 font-semibold text-gray-800">
                            Upload PDF
                        </Text>

                        {!file ? (
                            <Pressable
                                onPress={handlePickFile}
                                disabled={saving}
                                className="items-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-8"
                            >
                                <View className="rounded-full bg-red-100 p-4">
                                    <Ionicons
                                        name="document-text-outline"
                                        size={30}
                                        color="#dc2626"
                                    />
                                </View>

                                <Text className="mt-4 text-base font-bold text-gray-800">
                                    Select PDF File
                                </Text>

                                <Text className="mt-1 text-center text-sm text-gray-500">
                                    Choose a PDF from your device
                                </Text>

                                <View className="mt-4 rounded-lg bg-bronze px-4 py-2">
                                    <Text className="font-semibold text-white">
                                        Choose File
                                    </Text>
                                </View>
                            </Pressable>
                        ) : (
                            <View className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <View className="flex-row items-center">
                                    <View className="rounded-xl bg-red-100 p-3">
                                        <Ionicons
                                            name="document-text"
                                            size={28}
                                            color="#dc2626"
                                        />
                                    </View>

                                    <View className="ml-3 flex-1">
                                        <Text
                                            numberOfLines={2}
                                            className="font-bold text-gray-900"
                                        >
                                            {file.name}
                                        </Text>

                                        <Text className="mt-1 text-sm text-gray-500">
                                            PDF
                                            {file.size
                                                ? ` • ${formatFileSize(
                                                      file.size
                                                  )}`
                                                : ""}
                                        </Text>
                                    </View>

                                    <Pressable
                                        onPress={
                                            handleRemoveFile
                                        }
                                        disabled={saving}
                                        className="rounded-lg bg-red-50 p-2"
                                    >
                                        <Ionicons
                                            name="close"
                                            size={20}
                                            color="#dc2626"
                                        />
                                    </Pressable>
                                </View>

                                <Pressable
                                    onPress={
                                        handlePickFile
                                    }
                                    disabled={saving}
                                    className="mt-4 rounded-lg border border-gray-200 bg-white py-3"
                                >
                                    <Text className="text-center font-semibold text-gray-700">
                                        Change PDF
                                    </Text>
                                </Pressable>
                            </View>
                        )}

                        <Text className="mt-2 text-xs text-gray-500">
                            Only PDF files are supported.
                        </Text>
                    </View>
                </View>

                {/* =================================================
                    SAVE
                ================================================= */}

                <Pressable
                    onPress={handleUpload}
                    disabled={saving}
                    className={`mt-6 items-center rounded-xl px-5 py-4 ${
                        saving
                            ? "bg-gray-400"
                            : "bg-bronze"
                    }`}
                >
                    {saving ? (
                        <View className="flex-row items-center">
                            <ActivityIndicator
                                color="#ffffff"
                            />

                            <Text className="ml-2 font-bold text-white">
                                Uploading...
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center">
                            <Ionicons
                                name="cloud-upload-outline"
                                size={20}
                                color="#ffffff"
                            />

                            <Text className="ml-2 font-bold text-white">
                                Upload Resource
                            </Text>
                        </View>
                    )}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}