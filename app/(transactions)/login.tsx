import React, { useEffect, useState } from "react";

import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    Eye,
    EyeOff,
    ArrowLeft,
} from "lucide-react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    useRouter,
} from "expo-router";

import { useAuth } from "../../contexts/AuthContext";


/* =========================================================
   CONSTANTS
========================================================= */

const API_URL =
    "https://realtorparth.ca";


/* =========================================================
   COMPONENT
========================================================= */

export default function TransactionLogin() {

    const router = useRouter();

    const { user } = useAuth();


    /* =====================================================
       FORM STATE
    ===================================================== */

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);


    /* =====================================================
       SUPER ADMIN CHECKING
    ===================================================== */

    const [checkingAdmin, setCheckingAdmin] =
        useState(true);


    /* =====================================================
       CHECK SUPER ADMIN
    ===================================================== */

    useEffect(() => {

        const checkSuperAdmin =
            async () => {

                try {

                    /*
                     * Your website uses:
                     *
                     * localStorage.getItem("adminEmail")
                     *
                     * In React Native we use AsyncStorage.
                     */

                    const adminEmail =
                        await AsyncStorage.getItem(
                            "adminEmail"
                        );


                    /* -----------------------------------------
                       NO ADMIN LOGIN
                    ----------------------------------------- */

                    if (!adminEmail) {

                        setCheckingAdmin(false);

                        return;
                    }


                    /* -----------------------------------------
                       VERIFY FROM BACKEND
                    ----------------------------------------- */

                    const controller =
                        new AbortController();

                    const timeout =
                        setTimeout(() => {
                            controller.abort();
                        }, 10000);


                    const res =
                        await fetch(
                            `${API_URL}/api/transactions/check-super-admin/${encodeURIComponent(
                                adminEmail
                            )}`,
                            {
                                method: "GET",
                                signal: controller.signal,
                            }
                        );


                    clearTimeout(timeout);


                    let data;

                    try {

                        data =
                            await res.json();

                    } catch {

                        setCheckingAdmin(false);

                        return;
                    }


                    /* -----------------------------------------
                       NOT SUPER ADMIN
                    ----------------------------------------- */

                    if (
                        !data.success ||
                        !data.isSuperAdmin
                    ) {

                        setCheckingAdmin(false);

                        return;
                    }


                    /* -----------------------------------------
                       SAVE TRANSACTION ACCESS
                    ----------------------------------------- */

                    await AsyncStorage.setItem(
                        "transactionUser",
                        JSON.stringify({
                            ...data.user,
                            isSuperAdmin:
                                data.isSuperAdmin,
                            role:
                                data.role,
                        })
                    );


                    /* -----------------------------------------
                       REDIRECT
                    ----------------------------------------- */

                    router.replace(
                        "/(transactions)"
                    );

                } catch (error: any) {

                    console.log(
                        "Check Admin Error:",
                        error
                    );

                    setCheckingAdmin(false);

                }

            };


        checkSuperAdmin();

    }, [router]);


    /* =====================================================
       VALIDATE EMAIL
    ===================================================== */

    const isValidEmail =
        (value: string) => {

            return /\S+@\S+\.\S+/.test(
                value
            );

        };


    /* =====================================================
       LOGIN
    ===================================================== */

    const handleLogin =
        async () => {

            /* ---------------------------------------------
               VALIDATION
            --------------------------------------------- */

            if (
                !email.trim() ||
                !password.trim()
            ) {

                console.log(
                    "Email and password are required"
                );

                return;
            }


            if (
                !isValidEmail(
                    email.trim()
                )
            ) {

                console.log(
                    "Please enter a valid email"
                );

                return;
            }


            setLoading(true);


            try {

                /* -----------------------------------------
                   10 SECOND TIMEOUT
                ----------------------------------------- */

                const controller =
                    new AbortController();

                const timeout =
                    setTimeout(() => {

                        controller.abort();

                    }, 10000);


                /* -----------------------------------------
                   LOGIN API
                ----------------------------------------- */

                const res =
                    await fetch(
                        `${API_URL}/api/transactions/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    email:
                                        email.trim(),
                                    password,
                                }),

                            signal:
                                controller.signal,
                        }
                    );


                clearTimeout(timeout);


                /* -----------------------------------------
                   PARSE RESPONSE
                ----------------------------------------- */

                let data;

                try {

                    data =
                        await res.json();

                } catch {

                    throw new Error(
                        "Invalid server response"
                    );

                }


                /* -----------------------------------------
                   HTTP ERROR
                ----------------------------------------- */

                if (!res.ok) {

                    throw new Error(
                        data?.message ||
                        `Error ${res.status}`
                    );

                }


                /* -----------------------------------------
                   LOGIN FAILED
                ----------------------------------------- */

                if (!data.success) {

                    throw new Error(
                        data.message ||
                        "Login failed"
                    );

                }


                /* -----------------------------------------
                   SAVE USER
                ----------------------------------------- */

                await AsyncStorage.setItem(
                    "transactionUser",
                    JSON.stringify(
                        data.user
                    )
                );


                /* -----------------------------------------
                   SUCCESS
                ----------------------------------------- */

                console.log(
                    "Transaction login successful"
                );


                /* -----------------------------------------
                   REDIRECT
                ----------------------------------------- */

                router.replace(
                    "/(transactions)"
                );

            } catch (error: any) {

                console.error(
                    "Transaction Login Error:",
                    error
                );


                /* -----------------------------------------
                   TIMEOUT
                ----------------------------------------- */

                if (
                    error?.name ===
                    "AbortError"
                ) {

                    console.log(
                        "Request timed out. Please try again."
                    );

                }


                /* -----------------------------------------
                   NETWORK ERROR
                ----------------------------------------- */

                else if (
                    error?.name ===
                    "TypeError"
                ) {

                    console.log(
                        "Server is down or network error."
                    );

                }


                /* -----------------------------------------
                   OTHER ERROR
                ----------------------------------------- */

                else {

                    console.log(
                        error?.message ||
                        "Something went wrong"
                    );

                }

            } finally {

                setLoading(false);

            }

        };


    /* =====================================================
       CHECKING SUPER ADMIN
    ===================================================== */

    if (checkingAdmin) {

        return (
            <View className="flex-1 items-center justify-center bg-gray-100">

                <ActivityIndicator
                    size="large"
                    color="#A8794A"
                />

            </View>
        );

    }


    /* =====================================================
       UI
    ===================================================== */

    return (

        <KeyboardAvoidingView
            className="flex-1 bg-gray-100"
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >

            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                }}
                keyboardShouldPersistTaps="handled"
            >

                <View className="flex-1 items-center justify-center px-5 py-10">


                    {/* =================================================
                        LOGIN CARD
                    ================================================= */}

                    <View className="w-full max-w-[380px] rounded-xl bg-white p-8 shadow-md">


                        {/* =================================================
                            TITLE
                        ================================================= */}

                        <Text className="mb-6 text-center text-xl font-semibold text-gray-900">

                            Transaction Portal Login

                        </Text>


                        {/* =================================================
                            FORM
                        ================================================= */}

                        <View className="gap-4">


                            {/* =========================================
                                EMAIL
                            ========================================= */}

                            <View>

                                <Text className="mb-2 text-sm font-medium text-gray-700">

                                    Email

                                </Text>

                                <TextInput
                                    value={email}
                                    onChangeText={
                                        setEmail
                                    }
                                    placeholder="Email"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                    returnKeyType="next"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-[15px] text-gray-900"
                                />

                            </View>


                            {/* =========================================
                                PASSWORD
                            ========================================= */}

                            <View>

                                <Text className="mb-2 text-sm font-medium text-gray-700">

                                    Password

                                </Text>

                                <View className="relative">

                                    <TextInput
                                        value={
                                            password
                                        }
                                        onChangeText={
                                            setPassword
                                        }
                                        placeholder="Password"
                                        placeholderTextColor="#9ca3af"
                                        secureTextEntry={
                                            !showPassword
                                        }
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={
                                            !loading
                                        }
                                        returnKeyType="done"
                                        onSubmitEditing={
                                            handleLogin
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-3 pr-12 text-[15px] text-gray-900"
                                    />


                                    {/* PASSWORD TOGGLE */}

                                    <Pressable
                                        onPress={() =>
                                            setShowPassword(
                                                prev =>
                                                    !prev
                                            )
                                        }
                                        disabled={
                                            loading
                                        }
                                        className="absolute right-0 top-0 items-center justify-center px-3 py-3"
                                    >

                                        {showPassword ? (

                                            <EyeOff
                                                size={
                                                    19
                                                }
                                                color="#6b7280"
                                            />

                                        ) : (

                                            <Eye
                                                size={
                                                    19
                                                }
                                                color="#6b7280"
                                            />

                                        )}

                                    </Pressable>

                                </View>

                            </View>


                            {/* =========================================
                                LOGIN BUTTON
                            ========================================= */}

                            <Pressable
                                onPress={
                                    handleLogin
                                }
                                disabled={
                                    loading
                                }
                                className={`mt-1 w-full items-center rounded-lg bg-bronze py-3 ${
                                    loading
                                        ? "opacity-50"
                                        : "opacity-100"
                                }`}
                            >

                                {loading ? (

                                    <View className="flex-row items-center">

                                        <ActivityIndicator
                                            size="small"
                                            color="#ffffff"
                                        />

                                        <Text className="ml-2 text-[15px] font-semibold text-white">

                                            Logging in...

                                        </Text>

                                    </View>

                                ) : (

                                    <Text className="text-[15px] font-semibold text-white">

                                        Login

                                    </Text>

                                )}

                            </Pressable>

                        </View>


                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <View className="mt-6 flex-row items-center justify-center">

                            <Text className="text-sm text-gray-600">

                                Don't have an account?{" "}

                            </Text>

                            <Pressable
                                onPress={() =>
                                    router.push(
                                        "/(transactions)/signup"
                                    )
                                }
                            >

                                <Text className="text-sm font-medium text-bronze">

                                    Register

                                </Text>

                            </Pressable>

                        </View>

                    </View>

                </View>

            </ScrollView>

        </KeyboardAvoidingView>

    );

}