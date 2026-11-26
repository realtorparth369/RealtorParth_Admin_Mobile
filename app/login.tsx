import React, { useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import {
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react-native";

import axios from "axios";

import { useAuth } from "../contexts/AuthContext";


/* =========================================================
   API
========================================================= */

const API_URL =
  "https://realtorparth.ca";


/* =========================================================
   LOGIN SCREEN
========================================================= */

export default function LoginScreen() {

  const router = useRouter();

  /*
   * AuthContext
   *
   * signIn() saves the admin email into
   * mobile storage and updates user state.
   */

  const {
    signIn,
  } = useAuth();


  /* =======================================================
     STATE
  ======================================================= */

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  /* =======================================================
     LOGIN
  ======================================================= */

  const handleLogin = async () => {

    setError("");


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!email.trim()) {

      setError(
        "Please enter your email."
      );

      return;
    }


    if (!password.trim()) {

      setError(
        "Please enter your password."
      );

      return;
    }


    setLoading(true);


    try {

      console.log(
        "Attempting login..."
      );


      /* ===================================================
         LOGIN API
      =================================================== */

      const res =
        await axios.post(
          `${API_URL}/api/login`,
          {
            id: email.trim(),
            password,
          }
        );


      console.log(
        "Login response:",
        res.status,
        res.data
      );


      /* ===================================================
         LOGIN SUCCESS
      =================================================== */

      if (res.status === 200) {

        console.log(
          "Login successful"
        );


        /*
         * VERY IMPORTANT
         *
         * This saves the login to mobile storage
         * and updates AuthContext.user.
         */

        await signIn(
          email.trim()
        );


        console.log(
          "Admin saved to mobile storage"
        );


        /*
         * Now go to dashboard.
         */

        router.replace(
          "/(admin)"
        );

      }

    } catch (err: any) {

      console.error(
        "Login error:",
        err
      );


      console.error(
        "Login response:",
        err?.response?.data
      );


      setError(
        err?.response?.data?.message ||
        "Invalid email or password"
      );

    } finally {

      setLoading(false);

    }

  };


  /* =========================================================
     UI
  ========================================================= */

  return (

    <KeyboardAvoidingView
      className="flex-1"
      style={{
        backgroundColor: "#f3f4f6",
      }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >

      <ScrollView
        contentContainerClassName="
          flex-grow
          justify-center
          px-5
          py-10
        "

        keyboardShouldPersistTaps="handled"

        showsVerticalScrollIndicator={false}
      >

        <View className="
          w-full
          max-w-md
          self-center
        ">


          {/* =================================================
              CARD
          ================================================= */}

          <View className="
            rounded-2xl
            bg-white
            p-7
            shadow-xl
          ">


            {/* =================================================
                ICON
            ================================================= */}

            <View className="
              mb-4
              items-center
            ">

              <View className="
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                bg-bronze
              ">

                <LogIn
                  size={24}
                  color="#ffffff"
                />

              </View>

            </View>


            {/* =================================================
                TITLE
            ================================================= */}

            <View className="
              mb-8
              items-center
            ">

              <Text className="
                text-2xl
                font-bold
                text-gray-900
              ">
                Admin Login
              </Text>


              <Text className="
                mt-2
                text-center
                text-gray-600
              ">
                The Real Estate Realist Platform
              </Text>

            </View>


            {/* =================================================
                EMAIL
            ================================================= */}

            <View>

              <Text className="
                mb-2
                text-sm
                font-semibold
                text-gray-900
              ">
                Email
              </Text>


              <TextInput
                value={email}

                onChangeText={setEmail}

                placeholder="hello@realtorparth.ca"

                placeholderTextColor="#9ca3af"

                autoCapitalize="none"

                autoCorrect={false}

                keyboardType="email-address"

                editable={!loading}

                returnKeyType="next"

                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-gray-50
                  px-4
                  py-3
                  text-gray-900
                "
              />

            </View>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <View className="mt-5">

              <Text className="
                mb-2
                text-sm
                font-semibold
                text-gray-900
              ">
                Password
              </Text>


              <View className="relative">

                <TextInput
                  value={password}

                  onChangeText={setPassword}

                  placeholder="••••••••"

                  placeholderTextColor="#9ca3af"

                  secureTextEntry={
                    !showPassword
                  }

                  autoCapitalize="none"

                  autoCorrect={false}

                  editable={!loading}

                  returnKeyType="done"

                  onSubmitEditing={
                    handleLogin
                  }

                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-gray-50
                    px-4
                    py-3
                    pr-12
                    text-gray-900
                  "
                />


                <TouchableOpacity
                  onPress={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }

                  disabled={loading}

                  className="
                    absolute
                    right-0
                    top-0
                    h-full
                    w-12
                    items-center
                    justify-center
                  "

                  accessibilityLabel={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (

                    <EyeOff
                      size={19}
                      color="#6b7280"
                    />

                  ) : (

                    <Eye
                      size={19}
                      color="#6b7280"
                    />

                  )}

                </TouchableOpacity>

              </View>

            </View>


            {/* =================================================
                ERROR
            ================================================= */}

            {!!error && (

              <View className="
                mt-4
                rounded-lg
                border
                border-red-300
                bg-red-50
                p-3
              ">

                <Text className="
                  text-sm
                  text-red-800
                ">
                  {error}
                </Text>

              </View>

            )}


            {/* =================================================
                SIGN IN
            ================================================= */}

            <TouchableOpacity
              onPress={handleLogin}

              disabled={loading}

              activeOpacity={0.8}

              className={`
                mt-6
                w-full
                items-center
                rounded-lg
                px-4
                py-3
                ${
                  loading
                    ? "bg-gray-400"
                    : "bg-bronze"
                }
              `}
            >

              <Text className="
                font-semibold
                text-white
              ">

                {loading
                  ? "Authenticating..."
                  : "Sign In"}

              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>

  );
}