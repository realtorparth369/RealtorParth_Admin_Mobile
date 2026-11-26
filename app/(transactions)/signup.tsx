import React, { useState } from "react";

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
} from "lucide-react-native";

import {
    useRouter,
} from "expo-router";


/* =========================================================
   CONSTANTS
========================================================= */

const API_URL =
    "https://realtorparth.ca";


/* =========================================================
   FORM TYPE
========================================================= */

type RegisterForm = {
    name: string;
    email: string;
    password: string;
};


/* =========================================================
   COMPONENT
========================================================= */

export default function TransactionRegister() {

    const router = useRouter();


    /* =====================================================
       FORM STATE
    ===================================================== */

    const [form, setForm] =
        useState<RegisterForm>({
            name: "",
            email: "",
            password: "",
        });


    /* =====================================================
       UI STATE
    ===================================================== */

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);


    /* =====================================================
       UPDATE FORM
    ===================================================== */

    const handleChange = (
        field: keyof RegisterForm,
        value: string
    ) => {

        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));

    };


    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    const isValidEmail =
        (value: string) => {

            return /\S+@\S+\.\S+/.test(
                value
            );

        };


    /* =====================================================
       REGISTER
    ===================================================== */

    const handleRegister =
        async () => {

            const {
                name,
                email,
                password,
            } = form;


            /* ---------------------------------------------
               FRONTEND VALIDATION
            --------------------------------------------- */

            if (
                !name.trim() ||
                !email.trim() ||
                !password.trim()
            ) {

                console.log(
                    "All fields are required"
                );

                return;
            }


            if (
                name.trim().length < 2
            ) {

                console.log(
                    "Name must be at least 2 characters"
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


            if (
                password.length < 6
            ) {

                console.log(
                    "Password must be at least 6 characters"
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
                   REGISTER API
                ----------------------------------------- */

                const res =
                    await fetch(
                        `${API_URL}/api/transactions/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    name:
                                        name.trim(),

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
                   BUSINESS LOGIC
                ----------------------------------------- */

                if (!data.success) {

                    throw new Error(
                        data.message ||
                        "Registration failed"
                    );

                }


                /* -----------------------------------------
                   SUCCESS
                ----------------------------------------- */

                console.log(
                    "Account created successfully"
                );


                /* -----------------------------------------
                   CLEAR FORM
                ----------------------------------------- */

                setForm({
                    name: "",
                    email: "",
                    password: "",
                });


                /* -----------------------------------------
                   GO TO LOGIN
                ----------------------------------------- */

                router.replace(
                    "/(transactions)/login"
                );

            } catch (error: any) {

                console.error(
                    "Register Error:",
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
                        "Request timed out. Try again."
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
                        "Server is Down or Network error. Check your internet."
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
                        REGISTER CARD
                    ================================================= */}

                    <View className="w-full max-w-[400px] rounded-xl bg-white p-8 shadow-md">


                        {/* =================================================
                            TITLE
                        ================================================= */}

                        <Text className="mb-6 text-center text-xl font-semibold text-gray-900">

                            Transaction Portal Register

                        </Text>


                        {/* =================================================
                            FORM
                        ================================================= */}

                        <View className="gap-4">


                            {/* =========================================
                                NAME
                            ========================================= */}

                            <View>

                                <Text className="mb-2 text-sm font-medium text-gray-700">

                                    Full Name

                                </Text>

                                <TextInput
                                    value={
                                        form.name
                                    }
                                    onChangeText={(
                                        value
                                    ) =>
                                        handleChange(
                                            "name",
                                            value
                                        )
                                    }
                                    placeholder="Full Name"
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    editable={!loading}
                                    returnKeyType="next"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-[15px] text-gray-900"
                                />

                            </View>


                            {/* =========================================
                                EMAIL
                            ========================================= */}

                            <View>

                                <Text className="mb-2 text-sm font-medium text-gray-700">

                                    Email

                                </Text>

                                <TextInput
                                    value={
                                        form.email
                                    }
                                    onChangeText={(
                                        value
                                    ) =>
                                        handleChange(
                                            "email",
                                            value
                                        )
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
                                            form.password
                                        }
                                        onChangeText={(
                                            value
                                        ) =>
                                            handleChange(
                                                "password",
                                                value
                                            )
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
                                            handleRegister
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-3 pr-12 text-[15px] text-gray-900"
                                    />


                                    {/* PASSWORD TOGGLE */}

                                    <Pressable
                                        onPress={() =>
                                            setShowPassword(
                                                (prev) =>
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
                                REGISTER BUTTON
                            ========================================= */}

                            <Pressable
                                onPress={
                                    handleRegister
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

                                            Creating account...

                                        </Text>

                                    </View>

                                ) : (

                                    <Text className="text-[15px] font-semibold text-white">

                                        Register

                                    </Text>

                                )}

                            </Pressable>

                        </View>


                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <View className="mt-6 flex-row items-center justify-center">

                            <Text className="text-sm text-gray-600">

                                Already have an account?{" "}

                            </Text>

                            <Pressable
                                onPress={() =>
                                    router.replace(
                                        "/(transactions)/login"
                                    )
                                }
                            >

                                <Text className="text-sm font-medium text-bronze">

                                    Login

                                </Text>

                            </Pressable>

                        </View>

                    </View>

                </View>

            </ScrollView>

        </KeyboardAvoidingView>

    );

}