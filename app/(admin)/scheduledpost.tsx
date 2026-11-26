import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

const API_URL = "https://realtorparth.ca";

type ScheduledPost = {
  _id?: string;
  id?: string;

  topic?: string;
  caption?: string;

  images?: string[];

  platforms?: string[];

  publishDate?: string;
  scheduledDate?: string;
  publishAt?: string;

  status?: string;

  createdAt?: string;
  updatedAt?: string;

  socialPostIds?: {
    Facebook?: string;
    Instagram?: string;
    LinkedIn?: string;

    facebook?: string;
    instagram?: string;
    linkedin?: string;

    [key: string]: string | undefined;
  };

  platformStatuses?: {
    Facebook?: string;
    Instagram?: string;
    LinkedIn?: string;

    facebook?: string;
    instagram?: string;
    linkedin?: string;

    [key: string]: string | undefined;
  };
};

type SocialComment = {
  id?: string;
  _id?: string;
  commentId?: string;

  message?: string;
  text?: string;
  comment?: string;

  from?: {
    id?: string;
    name?: string;
    username?: string;
  };

  username?: string;
  name?: string;

  created_time?: string;
  timestamp?: string;

  like_count?: number;
  comment_count?: number;

  platform?: "facebook" | "instagram" | "linkedin" | string;
};

const getPostId = (post: ScheduledPost) => {
  return post._id || post.id || "";
};

const getPostImages = (post: ScheduledPost) => {
  if (!Array.isArray(post.images)) {
    return [];
  }

  return post.images.filter(Boolean);
};

const getPublishDate = (post: ScheduledPost) => {
  return (
    post.publishDate ||
    post.scheduledDate ||
    post.publishAt ||
    post.createdAt ||
    ""
  );
};

const getStatus = (post: ScheduledPost) => {
  return post.status || "scheduled";
};

const getPlatformLabel = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "facebook":
      return "Facebook";

    case "instagram":
      return "Instagram";

    case "linkedin":
      return "LinkedIn";

    default:
      return platform;
  }
};

const getPlatformSocialPostId = (
  post: ScheduledPost,
  platform: string
) => {
  const normalized = platform.toLowerCase();

  if (normalized === "facebook") {
    return (
      post.socialPostIds?.Facebook ||
      post.socialPostIds?.facebook ||
      ""
    );
  }

  if (normalized === "instagram") {
    return (
      post.socialPostIds?.Instagram ||
      post.socialPostIds?.instagram ||
      ""
    );
  }

  if (normalized === "linkedin") {
    return (
      post.socialPostIds?.LinkedIn ||
      post.socialPostIds?.linkedin ||
      ""
    );
  }

  return (
    post.socialPostIds?.[platform] ||
    post.socialPostIds?.[normalized] ||
    ""
  );
};

const normalizeComment = (
  comment: any,
  platform: string
): SocialComment | null => {
  if (!comment) {
    return null;
  }

  const id =
    comment.id ||
    comment._id ||
    comment.commentId ||
    "";

  const message =
    comment.message ||
    comment.text ||
    comment.comment ||
    "";

  if (!id || !message) {
    return null;
  }

  return {
    ...comment,
    id,
    message,
    platform: platform.toLowerCase(),
  };
};

const formatDate = (value?: string) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const formatTimeOnly = (value?: string) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ScheduledPostScreen() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [serverTime, setServerTime] = useState<Date | null>(null);

  const [selectedPost, setSelectedPost] =
    useState<ScheduledPost | null>(null);

  const [detailsVisible, setDetailsVisible] = useState(false);

  const [editVisible, setEditVisible] = useState(false);

  const [commentsVisible, setCommentsVisible] = useState(false);

  const [comments, setComments] = useState<SocialComment[]>([]);

  const [commentsLoading, setCommentsLoading] = useState(false);

  const [commentsRefreshing, setCommentsRefreshing] =
    useState(false);

  const [replyingComment, setReplyingComment] =
    useState<SocialComment | null>(null);

  const [replyText, setReplyText] = useState("");

  const [replyLoading, setReplyLoading] = useState(false);

  const [deletingCommentId, setDeletingCommentId] =
    useState<string | null>(null);

  const [deletingPostId, setDeletingPostId] =
    useState<string | null>(null);

  /**
   * ---------------------------------------------------------
   * FETCH SCHEDULED POSTS
   * ---------------------------------------------------------
   */

  const fetchScheduledPosts = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const response = await axios.get(
          `${API_URL}/api/socialpost/scheduled`
        );

        const data = response.data;

        let fetchedPosts: ScheduledPost[] = [];

        if (Array.isArray(data)) {
          fetchedPosts = data;
        } else if (Array.isArray(data?.posts)) {
          fetchedPosts = data.posts;
        } else if (Array.isArray(data?.data)) {
          fetchedPosts = data.data;
        }

        setPosts(fetchedPosts);
      } catch (error) {
        console.error(
          "FETCH SCHEDULED POSTS ERROR:",
          error
        );

        if (showLoader) {
          Alert.alert(
            "Error",
            "Failed to load scheduled posts."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /**
   * ---------------------------------------------------------
   * FETCH SERVER TIME
   * ---------------------------------------------------------
   */

  const fetchServerTime = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/servertime`
      );

      const rawTime =
        response.data?.serverTime ||
        response.data?.time ||
        response.data?.data ||
        response.data;

      if (rawTime) {
        const date = new Date(rawTime);

        if (!Number.isNaN(date.getTime())) {
          setServerTime(date);
        }
      }
    } catch (error) {
      console.error(
        "SERVER TIME ERROR:",
        error
      );
    }
  }, []);

  /**
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    fetchScheduledPosts(true);
    fetchServerTime();
  }, [
    fetchScheduledPosts,
    fetchServerTime,
  ]);

  /**
   * ---------------------------------------------------------
   * AUTO REFRESH
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const interval = setInterval(() => {
      fetchScheduledPosts(false);
      fetchServerTime();
    }, 3000);

    return () => clearInterval(interval);
  }, [
    fetchScheduledPosts,
    fetchServerTime,
  ]);

  /**
   * ---------------------------------------------------------
   * REFRESH
   * ---------------------------------------------------------
   */

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    await Promise.all([
      fetchScheduledPosts(false),
      fetchServerTime(),
    ]);

    setRefreshing(false);
  }, [
    fetchScheduledPosts,
    fetchServerTime,
  ]);

  /**
   * ---------------------------------------------------------
   * SORT POSTS
   * ---------------------------------------------------------
   */

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const aDate = new Date(
        getPublishDate(a)
      ).getTime();

      const bDate = new Date(
        getPublishDate(b)
      ).getTime();

      return bDate - aDate;
    });
  }, [posts]);

  /**
   * ---------------------------------------------------------
   * OPEN DETAILS
   * ---------------------------------------------------------
   */

  const openDetails = (post: ScheduledPost) => {
    setSelectedPost(post);
    setDetailsVisible(true);
  };

  const closeDetails = () => {
    setDetailsVisible(false);
    setSelectedPost(null);
  };

  /**
   * ---------------------------------------------------------
   * OPEN EDIT
   * ---------------------------------------------------------
   */

  const openEdit = (post: ScheduledPost) => {
    setSelectedPost(post);
    setEditVisible(true);
  };

  const closeEdit = () => {
    setEditVisible(false);
  };

  /**
   * ---------------------------------------------------------
   * GET COMMENTS
   *
   * IMPORTANT:
   * We DO NOT use:
   *
   * post._id
   *
   * We use:
   *
   * post.socialPostIds.Facebook
   * post.socialPostIds.Instagram
   *
   * exactly like the website.
   * ---------------------------------------------------------
   */

  const fetchComments = useCallback(
    async (
      post: ScheduledPost,
      showLoader = true
    ) => {
      try {
        if (showLoader) {
          setCommentsLoading(true);
        }

        setComments([]);

        console.log(
          "================================"
        );
        console.log(
          "MOBILE SELECTED SOCIAL POST"
        );
        console.log(
          "post _id:",
          post._id
        );
        console.log(
          "post id:",
          post.id
        );
        console.log(
          "topic:",
          post.topic
        );
        console.log(
          "platforms:",
          post.platforms
        );
        console.log(
          "socialPostIds:",
          post.socialPostIds
        );
        console.log(
          "Facebook social ID:",
          getPlatformSocialPostId(
            post,
            "facebook"
          )
        );
        console.log(
          "Instagram social ID:",
          getPlatformSocialPostId(
            post,
            "instagram"
          )
        );
        console.log(
          "================================"
        );

        const requests: Promise<any>[] = [];

        /**
         * FACEBOOK
         */

        const facebookPostId =
          getPlatformSocialPostId(
            post,
            "facebook"
          );

        if (facebookPostId) {
          console.log(
            "================================"
          );

          console.log(
            "FACEBOOK COMMENT REQUEST"
          );

          console.log(
            "platform:",
            "facebook"
          );

          console.log(
            "postId:",
            facebookPostId
          );

          console.log(
            "================================"
          );

          requests.push(
            axios
              .post(
                `${API_URL}/api/social-comments/list`,
                {
                  platform: "facebook",
                  postId: facebookPostId,
                }
              )
              .then((response) => ({
                platform: "facebook",
                response,
              }))
          );
        }

        /**
         * INSTAGRAM
         */

        const instagramPostId =
          getPlatformSocialPostId(
            post,
            "instagram"
          );

        if (instagramPostId) {
          console.log(
            "================================"
          );

          console.log(
            "INSTAGRAM COMMENT REQUEST"
          );

          console.log(
            "platform:",
            "instagram"
          );

          console.log(
            "postId:",
            instagramPostId
          );

          console.log(
            "================================"
          );

          requests.push(
            axios
              .post(
                `${API_URL}/api/social-comments/list`,
                {
                  platform: "instagram",
                  postId: instagramPostId,
                }
              )
              .then((response) => ({
                platform: "instagram",
                response,
              }))
          );
        }

        /**
         * LINKEDIN
         *
         * Only request this if your backend supports
         * LinkedIn comments through the same endpoint.
         */

        const linkedinPostId =
          getPlatformSocialPostId(
            post,
            "linkedin"
          );

        if (linkedinPostId) {
          console.log(
            "================================"
          );

          console.log(
            "LINKEDIN COMMENT REQUEST"
          );

          console.log(
            "platform:",
            "linkedin"
          );

          console.log(
            "postId:",
            linkedinPostId
          );

          console.log(
            "================================"
          );

          requests.push(
            axios
              .post(
                `${API_URL}/api/social-comments/list`,
                {
                  platform: "linkedin",
                  postId: linkedinPostId,
                }
              )
              .then((response) => ({
                platform: "linkedin",
                response,
              }))
          );
        }

        if (requests.length === 0) {
          console.log(
            "NO SOCIAL POST IDS AVAILABLE"
          );

          setComments([]);
          return;
        }

        /**
         * allSettled is important.
         *
         * If Instagram returns 500 but Facebook works,
         * Facebook comments will still be displayed.
         */

        const results =
          await Promise.allSettled(
            requests
          );

        const allComments: SocialComment[] = [];

        for (const result of results) {
          if (
            result.status !==
            "fulfilled"
          ) {
            const error =
              result.reason;

            console.error(
              "================================"
            );

            console.error(
              "COMMENT REQUEST FAILED"
            );

            console.error(
              "STATUS:",
              error?.response?.status
            );

            console.error(
              "RESPONSE DATA:",
              error?.response?.data
            );

            console.error(
              "RESPONSE HEADERS:",
              error?.response?.headers
            );

            console.error(
              "REQUEST URL:",
              error?.config?.url
            );

            console.error(
              "REQUEST METHOD:",
              error?.config?.method
            );

            console.error(
              "REQUEST DATA:",
              error?.config?.data
            );

            console.error(
              "ERROR MESSAGE:",
              error?.message
            );

            console.error(
              "================================"
            );

            continue;
          }

          const platform =
            result.value.platform;

          const response =
            result.value.response;

          console.log(
            "================================"
          );

          console.log(
            `${platform.toUpperCase()} COMMENTS RESPONSE`
          );

          console.log(
            "STATUS:",
            response?.status
          );

          console.log(
            "DATA:",
            response?.data
          );

          console.log(
            "================================"
          );

          let platformComments: any[] =
            [];

          if (
            Array.isArray(
              response?.data
            )
          ) {
            platformComments =
              response.data;
          } else if (
            Array.isArray(
              response?.data?.comments
            )
          ) {
            platformComments =
              response.data.comments;
          } else if (
            Array.isArray(
              response?.data?.data
            )
          ) {
            platformComments =
              response.data.data;
          }

          for (const rawComment of platformComments) {
            const normalized =
              normalizeComment(
                rawComment,
                platform
              );

            if (normalized) {
              allComments.push(
                normalized
              );
            }
          }
        }

        console.log(
          "================================"
        );

        console.log(
          "FINAL COMMENTS:",
          allComments
        );

        console.log(
          "================================"
        );

        setComments(
          allComments
        );
      } catch (error) {
        console.error(
          "FETCH COMMENTS ERROR:",
          error
        );

        if (showLoader) {
          Alert.alert(
            "Error",
            "Failed to load comments."
          );
        }
      } finally {
        setCommentsLoading(false);
        setCommentsRefreshing(false);
      }
    },
    []
  );

  /**
   * ---------------------------------------------------------
   * OPEN COMMENTS
   * ---------------------------------------------------------
   */

  const openComments = async (
    post: ScheduledPost
  ) => {
    setSelectedPost(post);
    setCommentsVisible(true);

    await fetchComments(
      post,
      true
    );
  };

  const closeComments = () => {
    setCommentsVisible(false);
    setReplyingComment(null);
    setReplyText("");
  };

  /**
   * ---------------------------------------------------------
   * REFRESH COMMENTS
   * ---------------------------------------------------------
   */

  const refreshComments = async () => {
    if (!selectedPost) {
      return;
    }

    setCommentsRefreshing(true);

    await fetchComments(
      selectedPost,
      false
    );

    setCommentsRefreshing(false);
  };

  /**
   * ---------------------------------------------------------
   * REPLY COMMENT
   *
   * IMPORTANT:
   * Uses the platform of THIS comment.
   * ---------------------------------------------------------
   */

  const replyToComment = async (
    comment: SocialComment
  ) => {
    if (!selectedPost) {
      return;
    }

    const text =
      replyText.trim();

    if (!text) {
      Alert.alert(
        "Reply",
        "Please enter a reply."
      );

      return;
    }

    const platform =
      (
        comment.platform ||
        ""
      ).toLowerCase();

    const socialPostId =
      getPlatformSocialPostId(
        selectedPost,
        platform
      );

    const commentId =
      comment.id ||
      comment._id ||
      comment.commentId ||
      "";

    if (!socialPostId) {
      Alert.alert(
        "Error",
        `No ${getPlatformLabel(
          platform
        )} social post ID found.`
      );

      return;
    }

    if (!commentId) {
      Alert.alert(
        "Error",
        "Comment ID is missing."
      );

      return;
    }

    try {
      setReplyLoading(true);

      console.log(
        "================================"
      );

      console.log(
        "COMMENT REPLY REQUEST"
      );

      console.log(
        "platform:",
        platform
      );

      console.log(
        "postId:",
        socialPostId
      );

      console.log(
        "commentId:",
        commentId
      );

      console.log(
        "message:",
        text
      );

      console.log(
        "================================"
      );

      await axios.post(
        `${API_URL}/api/social-comments/reply`,
        {
          platform,
          postId: socialPostId,
          commentId,
          message: text,
        }
      );

      setReplyText("");
      setReplyingComment(null);

      Alert.alert(
        "Success",
        "Reply sent successfully."
      );

      await fetchComments(
        selectedPost,
        false
      );
    } catch (error: any) {
      console.error(
        "COMMENT REPLY FAILED:",
        error?.response?.data ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to send reply."
      );
    } finally {
      setReplyLoading(false);
    }
  };

  /**
   * ---------------------------------------------------------
   * DELETE FACEBOOK COMMENT
   * ---------------------------------------------------------
   */

  const deleteComment = async (
    comment: SocialComment
  ) => {
    if (!selectedPost) {
      return;
    }

    const platform =
      (
        comment.platform ||
        ""
      ).toLowerCase();

    if (platform !== "facebook") {
      Alert.alert(
        "Not supported",
        "Comment deletion is currently available for Facebook comments only."
      );

      return;
    }

    const socialPostId =
      getPlatformSocialPostId(
        selectedPost,
        "facebook"
      );

    const commentId =
      comment.id ||
      comment._id ||
      comment.commentId ||
      "";

    if (!socialPostId) {
      Alert.alert(
        "Error",
        "Facebook social post ID is missing."
      );

      return;
    }

    if (!commentId) {
      Alert.alert(
        "Error",
        "Comment ID is missing."
      );

      return;
    }

    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingCommentId(
                commentId
              );

              console.log(
                "DELETE FACEBOOK COMMENT",
                {
                  platform: "facebook",
                  postId:
                    socialPostId,
                  commentId,
                }
              );

              await axios.delete(
                `${API_URL}/api/social-comments/${commentId}`,
                {
                  data: {
                    platform:
                      "facebook",
                    postId:
                      socialPostId,
                  },
                }
              );

              setComments(
                (previous) =>
                  previous.filter(
                    (item) =>
                      (item.id ||
                        item._id ||
                        item.commentId) !==
                      commentId
                  )
              );

              Alert.alert(
                "Success",
                "Comment deleted successfully."
              );
            } catch (error: any) {
              console.error(
                "DELETE COMMENT FAILED:",
                error?.response
                  ?.data ||
                  error
              );

              Alert.alert(
                "Error",
                error?.response?.data
                  ?.message ||
                  "Failed to delete comment."
              );
            } finally {
              setDeletingCommentId(
                null
              );
            }
          },
        },
      ]
    );
  };

  /**
   * ---------------------------------------------------------
   * DELETE / CANCEL SCHEDULED POST
   * ---------------------------------------------------------
   */

  const deleteScheduledPost = async (
    post: ScheduledPost
  ) => {
    const postId =
      getPostId(post);

    if (!postId) {
      Alert.alert(
        "Error",
        "Post ID is missing."
      );

      return;
    }

    Alert.alert(
      "Cancel Scheduled Post",
      "Are you sure you want to cancel this scheduled post?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingPostId(
                postId
              );

              await axios.delete(
                `${API_URL}/api/socialpost/${postId}`
              );

              setPosts(
                (previous) =>
                  previous.filter(
                    (item) =>
                      getPostId(item) !==
                      postId
                  )
              );

              if (
                selectedPost &&
                getPostId(
                  selectedPost
                ) === postId
              ) {
                setSelectedPost(
                  null
                );
              }

              Alert.alert(
                "Success",
                "Scheduled post cancelled successfully."
              );
            } catch (error: any) {
              console.error(
                "DELETE SCHEDULED POST ERROR:",
                error?.response
                  ?.data ||
                  error
              );

              Alert.alert(
                "Error",
                error?.response?.data
                  ?.message ||
                  "Failed to cancel scheduled post."
              );
            } finally {
              setDeletingPostId(
                null
              );
            }
          },
        },
      ]
    );
  };

  /**
   * ---------------------------------------------------------
   * REMOVE POSTED POST
   * ---------------------------------------------------------
   */

  const removePostedPost = async (
    post: ScheduledPost
  ) => {
    const postId =
      getPostId(post);

    if (!postId) {
      Alert.alert(
        "Error",
        "Post ID is missing."
      );

      return;
    }

    Alert.alert(
      "Remove Post",
      "Are you sure you want to remove this post?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingPostId(
                postId
              );

              await axios.post(
                `${API_URL}/api/socialpost/remove/${postId}`
              );

              setPosts(
                (previous) =>
                  previous.filter(
                    (item) =>
                      getPostId(item) !==
                      postId
                  )
              );

              Alert.alert(
                "Success",
                "Post removed successfully."
              );
            } catch (error: any) {
              console.error(
                "REMOVE POST ERROR:",
                error?.response
                  ?.data ||
                  error
              );

              Alert.alert(
                "Error",
                error?.response?.data
                  ?.message ||
                  "Failed to remove post."
              );
            } finally {
              setDeletingPostId(
                null
              );
            }
          },
        },
      ]
    );
  };

  /**
   * ---------------------------------------------------------
   * STATUS
   * ---------------------------------------------------------
   */

  const getStatusText = (
    post: ScheduledPost
  ) => {
    return getStatus(post)
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  const getStatusClass = (
    post: ScheduledPost
  ) => {
    const status =
      getStatus(post).toLowerCase();

    if (
      status === "published" ||
      status === "posted" ||
      status === "success"
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      status === "failed" ||
      status === "error"
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      status === "processing" ||
      status === "publishing"
    ) {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-blue-100 text-blue-700";
  };

  /**
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <View className="flex-1 bg-slate-50">
      {/* HEADER */}

      <View className="border-b border-slate-200 bg-white px-5 pb-4 pt-5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-slate-900">
              Scheduled Posts
            </Text>

            <Text className="mt-1 text-sm text-slate-500">
              Manage your scheduled and published social posts
            </Text>
          </View>

          <Pressable
            onPress={onRefresh}
            className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
          >
            <Ionicons
              name="refresh"
              size={20}
              color="#334155"
            />
          </Pressable>
        </View>
      </View>

      {/* POSTS */}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
          />

          <Text className="mt-3 text-sm text-slate-500">
            Loading posts...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          {sortedPosts.length ===
          0 ? (
            <View className="items-center rounded-3xl border border-slate-200 bg-white px-6 py-12">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Ionicons
                  name="calendar-outline"
                  size={30}
                  color="#64748b"
                />
              </View>

              <Text className="text-lg font-bold text-slate-900">
                No Scheduled Posts
              </Text>

              <Text className="mt-2 text-center text-sm text-slate-500">
                You don't have any scheduled posts yet.
              </Text>
            </View>
          ) : (
            sortedPosts.map(
              (post) => {
                const postId =
                  getPostId(post);

                const images =
                  getPostImages(post);

                const status =
                  getStatus(post);

                const isDeleting =
                  deletingPostId ===
                  postId;

                return (
                  <View
                    key={postId}
                    className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white"
                  >
                    {/* IMAGE */}

                    {images.length >
                    0 ? (
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={
                          false
                        }
                      >
                        {images.map(
                          (
                            image,
                            index
                          ) => (
                            <Image
                              key={`${image}-${index}`}
                              source={{
                                uri: image,
                              }}
                              className="h-56 w-[350px]"
                              resizeMode="cover"
                            />
                          )
                        )}
                      </ScrollView>
                    ) : (
                      <View className="h-40 items-center justify-center bg-slate-100">
                        <Ionicons
                          name="image-outline"
                          size={40}
                          color="#94a3b8"
                        />

                        <Text className="mt-2 text-sm text-slate-400">
                          No image
                        </Text>
                      </View>
                    )}

                    {/* CONTENT */}

                    <View className="p-5">
                      <View className="mb-3 flex-row items-center justify-between">
                        <View
                          className={`rounded-full px-3 py-1 ${getStatusClass(
                            post
                          )}`}
                        >
                          <Text className="text-xs font-semibold">
                            {getStatusText(
                              post
                            )}
                          </Text>
                        </View>

                        <Text className="text-xs text-slate-400">
                          {formatDate(
                            getPublishDate(
                              post
                            )
                          )}
                        </Text>
                      </View>

                      <Text
                        className="text-lg font-bold text-slate-900"
                        numberOfLines={2}
                      >
                        {post.topic ||
                          "Untitled Post"}
                      </Text>

                      {!!post.caption && (
                        <Text
                          className="mt-2 text-sm leading-5 text-slate-500"
                          numberOfLines={3}
                        >
                          {post.caption}
                        </Text>
                      )}

                      {/* PLATFORMS */}

                      {!!post.platforms
                        ?.length && (
                        <View className="mt-4 flex-row flex-wrap">
                          {post.platforms.map(
                            (
                              platform
                            ) => (
                              <View
                                key={
                                  platform
                                }
                                className="mr-2 mb-2 flex-row items-center rounded-full bg-slate-100 px-3 py-1.5"
                              >
                                <Ionicons
                                  name={
                                    platform.toLowerCase() ===
                                    "instagram"
                                      ? "logo-instagram"
                                      : platform.toLowerCase() ===
                                        "facebook"
                                      ? "logo-facebook"
                                      : "logo-linkedin"
                                  }
                                  size={
                                    14
                                  }
                                  color="#475569"
                                />

                                <Text className="ml-1.5 text-xs font-medium text-slate-600">
                                  {getPlatformLabel(
                                    platform
                                  )}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      )}

                      {/* ACTIONS */}

                      <View className="mt-4 flex-row flex-wrap">
                        <Pressable
                          onPress={() =>
                            openDetails(
                              post
                            )
                          }
                          className="mr-2 mb-2 flex-row items-center rounded-xl bg-slate-100 px-4 py-3"
                        >
                          <Ionicons
                            name="eye-outline"
                            size={17}
                            color="#334155"
                          />

                          <Text className="ml-2 text-sm font-semibold text-slate-700">
                            Details
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            openEdit(
                              post
                            )
                          }
                          className="mr-2 mb-2 flex-row items-center rounded-xl bg-blue-50 px-4 py-3"
                        >
                          <Ionicons
                            name="create-outline"
                            size={17}
                            color="#2563eb"
                          />

                          <Text className="ml-2 text-sm font-semibold text-blue-600">
                            Edit
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            openComments(
                              post
                            )
                          }
                          className="mr-2 mb-2 flex-row items-center rounded-xl bg-purple-50 px-4 py-3"
                        >
                          <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={17}
                            color="#7c3aed"
                          />

                          <Text className="ml-2 text-sm font-semibold text-purple-600">
                            Comments
                          </Text>
                        </Pressable>

                        {status
                          .toLowerCase() ===
                        "posted" ||
                        status.toLowerCase() ===
                          "published" ? (
                          <Pressable
                            disabled={
                              isDeleting
                            }
                            onPress={() =>
                              removePostedPost(
                                post
                              )
                            }
                            className="mb-2 flex-row items-center rounded-xl bg-red-50 px-4 py-3"
                          >
                            {isDeleting ? (
                              <ActivityIndicator
                                size="small"
                                color="#dc2626"
                              />
                            ) : (
                              <Ionicons
                                name="trash-outline"
                                size={
                                  17
                                }
                                color="#dc2626"
                              />
                            )}

                            <Text className="ml-2 text-sm font-semibold text-red-600">
                              Remove
                            </Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            disabled={
                              isDeleting
                            }
                            onPress={() =>
                              deleteScheduledPost(
                                post
                              )
                            }
                            className="mb-2 flex-row items-center rounded-xl bg-red-50 px-4 py-3"
                          >
                            {isDeleting ? (
                              <ActivityIndicator
                                size="small"
                                color="#dc2626"
                              />
                            ) : (
                              <Ionicons
                                name="close-circle-outline"
                                size={
                                  17
                                }
                                color="#dc2626"
                              />
                            )}

                            <Text className="ml-2 text-sm font-semibold text-red-600">
                              Cancel
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                );
              }
            )
          )}
        </ScrollView>
      )}

      {/* =====================================================
          DETAILS MODAL
          ===================================================== */}

      <Modal
        visible={detailsVisible}
        transparent
        animationType="slide"
        onRequestClose={
          closeDetails
        }
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[92%] overflow-hidden rounded-t-[30px] bg-white">
            <View className="flex-row items-center justify-between border-b border-slate-200 px-5 py-5">
              <Text className="text-xl font-bold text-slate-900">
                Post Details
              </Text>

              <Pressable
                onPress={
                  closeDetails
                }
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#334155"
                />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{
                padding: 20,
                paddingBottom: 40,
              }}
            >
              {selectedPost && (
                <>
                  {/* IMAGES */}

                  {getPostImages(
                    selectedPost
                  ).length >
                    0 && (
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={
                        false
                      }
                      className="mb-5"
                    >
                      {getPostImages(
                        selectedPost
                      ).map(
                        (
                          image,
                          index
                        ) => (
                          <Image
                            key={`${image}-${index}`}
                            source={{
                              uri: image,
                            }}
                            className="h-64 w-[350px] rounded-2xl"
                            resizeMode="cover"
                          />
                        )
                      )}
                    </ScrollView>
                  )}

                  <Text className="text-xl font-bold text-slate-900">
                    {selectedPost.topic ||
                      "Untitled Post"}
                  </Text>

                  {!!selectedPost.caption && (
                    <Text className="mt-3 text-sm leading-6 text-slate-600">
                      {
                        selectedPost.caption
                      }
                    </Text>
                  )}

                  <View className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <Text className="text-xs font-semibold uppercase text-slate-400">
                      Publish Date
                    </Text>

                    <Text className="mt-1 text-sm font-medium text-slate-800">
                      {formatDate(
                        getPublishDate(
                          selectedPost
                        )
                      )}
                    </Text>
                  </View>

                  <View className="mt-3 rounded-2xl bg-slate-50 p-4">
                    <Text className="text-xs font-semibold uppercase text-slate-400">
                      Status
                    </Text>

                    <Text className="mt-1 text-sm font-medium text-slate-800">
                      {getStatusText(
                        selectedPost
                      )}
                    </Text>
                  </View>

                  {/* PLATFORM IDS */}

                  <View className="mt-5">
                    <Text className="mb-3 text-base font-bold text-slate-900">
                      Platform Status
                    </Text>

                    {(
                      selectedPost.platforms ||
                      []
                    ).map(
                      (platform) => {
                        const socialId =
                          getPlatformSocialPostId(
                            selectedPost,
                            platform
                          );

                        const platformStatus =
                          selectedPost
                            .platformStatuses
                            ?.[
                            platform
                          ] ||
                          selectedPost
                            .platformStatuses
                            ?.[
                            platform.toLowerCase()
                          ] ||
                          "N/A";

                        return (
                          <View
                            key={
                              platform
                            }
                            className="mb-3 rounded-2xl border border-slate-200 p-4"
                          >
                            <View className="flex-row items-center justify-between">
                              <Text className="font-semibold text-slate-800">
                                {getPlatformLabel(
                                  platform
                                )}
                              </Text>

                              <Text className="text-xs text-slate-500">
                                {
                                  platformStatus
                                }
                              </Text>
                            </View>

                            {!!socialId && (
                              <Text
                                className="mt-2 text-xs text-slate-400"
                                selectable
                              >
                                ID:{" "}
                                {
                                  socialId
                                }
                              </Text>
                            )}
                          </View>
                        );
                      }
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =====================================================
          EDIT MODAL
          ===================================================== */}

      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={
          closeEdit
        }
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[90%] overflow-hidden rounded-t-[30px] bg-white">
            <View className="flex-row items-center justify-between border-b border-slate-200 px-5 py-5">
              <Text className="text-xl font-bold text-slate-900">
                Edit Post
              </Text>

              <Pressable
                onPress={closeEdit}
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#334155"
                />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{
                padding: 20,
                paddingBottom: 40,
              }}
            >
              {selectedPost && (
                <>
                  <Text className="mb-2 text-sm font-semibold text-slate-700">
                    Topic
                  </Text>

                  <View className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Text className="text-sm text-slate-700">
                      {selectedPost.topic ||
                        "N/A"}
                    </Text>
                  </View>

                  <Text className="mb-2 text-sm font-semibold text-slate-700">
                    Caption
                  </Text>

                  <View className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <Text className="text-sm leading-6 text-slate-700">
                      {selectedPost.caption ||
                        "N/A"}
                    </Text>
                  </View>

                  <View className="mt-5 rounded-2xl bg-yellow-50 p-4">
                    <Text className="text-sm leading-5 text-yellow-800">
                      Edit functionality is connected to the same post data. Keep your existing edit form/API here if your project already has one.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =====================================================
          COMMENTS MODAL
          ===================================================== */}

      <Modal
        visible={commentsVisible}
        transparent
        animationType="slide"
        onRequestClose={
          closeComments
        }
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="h-[92%] overflow-hidden rounded-t-[30px] bg-white">
            {/* HEADER */}

            <View className="flex-row items-center justify-between border-b border-slate-200 px-5 py-5">
              <View>
                <Text className="text-xl font-bold text-slate-900">
                  Comments
                </Text>

                {selectedPost && (
                  <Text
                    className="mt-1 max-w-[280px] text-xs text-slate-500"
                    numberOfLines={1}
                  >
                    {
                      selectedPost.topic
                    }
                  </Text>
                )}
              </View>

              <View className="flex-row items-center">
                <Pressable
                  onPress={
                    refreshComments
                  }
                  className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-slate-100"
                >
                  <Ionicons
                    name="refresh"
                    size={19}
                    color="#334155"
                  />
                </Pressable>

                <Pressable
                  onPress={
                    closeComments
                  }
                  className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color="#334155"
                  />
                </Pressable>
              </View>
            </View>

            {/* COMMENTS */}

            {commentsLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator
                  size="large"
                />

                <Text className="mt-3 text-sm text-slate-500">
                  Loading comments...
                </Text>
              </View>
            ) : (
              <ScrollView
                className="flex-1"
                contentContainerStyle={{
                  padding: 20,
                  paddingBottom: 40,
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={
                      commentsRefreshing
                    }
                    onRefresh={
                      refreshComments
                    }
                  />
                }
              >
                {comments.length ===
                0 ? (
                  <View className="items-center rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12">
                    <Ionicons
                      name="chatbubble-outline"
                      size={38}
                      color="#94a3b8"
                    />

                    <Text className="mt-3 text-base font-bold text-slate-800">
                      No Comments
                    </Text>

                    <Text className="mt-1 text-center text-sm text-slate-500">
                      No comments were found for this post.
                    </Text>
                  </View>
                ) : (
                  comments.map(
                    (
                      comment,
                      index
                    ) => {
                      const commentId =
                        comment.id ||
                        comment._id ||
                        comment.commentId ||
                        `comment-${index}`;

                      const platform =
                        (
                          comment.platform ||
                          ""
                        ).toLowerCase();

                      const author =
                        comment.from
                          ?.name ||
                        comment.name ||
                        comment.username ||
                        "Unknown";

                      const message =
                        comment.message ||
                        comment.text ||
                        comment.comment ||
                        "";

                      const isDeleting =
                        deletingCommentId ===
                        commentId;

                      const isReplying =
                        replyingComment ===
                        comment;

                      return (
                        <View
                          key={
                            commentId
                          }
                          className="mb-4 rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          {/* COMMENT HEADER */}

                          <View className="flex-row items-start justify-between">
                            <View className="flex-1 flex-row items-center">
                              <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                                <Ionicons
                                  name="person"
                                  size={
                                    18
                                  }
                                  color="#64748b"
                                />
                              </View>

                              <View className="ml-3 flex-1">
                                <Text className="text-sm font-bold text-slate-900">
                                  {
                                    author
                                  }
                                </Text>

                                <View className="mt-1 flex-row items-center">
                                  <Ionicons
                                    name={
                                      platform ===
                                      "instagram"
                                        ? "logo-instagram"
                                        : platform ===
                                          "facebook"
                                        ? "logo-facebook"
                                        : "logo-linkedin"
                                    }
                                    size={
                                      13
                                    }
                                    color="#64748b"
                                  />

                                  <Text className="ml-1 text-xs capitalize text-slate-400">
                                    {
                                      platform
                                    }
                                  </Text>

                                  {!!(
                                    comment.created_time ||
                                    comment.timestamp
                                  ) && (
                                    <>
                                      <Text className="mx-1 text-xs text-slate-300">
                                        •
                                      </Text>

                                      <Text className="text-xs text-slate-400">
                                        {formatDate(
                                          comment.created_time ||
                                            comment.timestamp
                                        )}
                                      </Text>
                                    </>
                                  )}
                                </View>
                              </View>
                            </View>

                            {platform ===
                              "facebook" && (
                              <Pressable
                                disabled={
                                  isDeleting
                                }
                                onPress={() =>
                                  deleteComment(
                                    comment
                                  )
                                }
                                className="h-9 w-9 items-center justify-center rounded-full bg-red-50"
                              >
                                {isDeleting ? (
                                  <ActivityIndicator
                                    size="small"
                                    color="#dc2626"
                                  />
                                ) : (
                                  <Ionicons
                                    name="trash-outline"
                                    size={
                                      17
                                    }
                                    color="#dc2626"
                                  />
                                )}
                              </Pressable>
                            )}
                          </View>

                          {/* MESSAGE */}

                          <Text className="mt-4 text-sm leading-6 text-slate-700">
                            {message}
                          </Text>

                          {/* COMMENT STATS */}

                          <View className="mt-3 flex-row items-center">
                            {typeof comment.like_count ===
                              "number" && (
                              <View className="mr-4 flex-row items-center">
                                <Ionicons
                                  name="heart-outline"
                                  size={
                                    14
                                  }
                                  color="#94a3b8"
                                />

                                <Text className="ml-1 text-xs text-slate-400">
                                  {
                                    comment.like_count
                                  }
                                </Text>
                              </View>
                            )}

                            {typeof comment.comment_count ===
                              "number" && (
                              <View className="flex-row items-center">
                                <Ionicons
                                  name="chatbubble-outline"
                                  size={
                                    14
                                  }
                                  color="#94a3b8"
                                />

                                <Text className="ml-1 text-xs text-slate-400">
                                  {
                                    comment.comment_count
                                  }
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* REPLY */}

                          <View className="mt-4 border-t border-slate-100 pt-3">
                            {!isReplying ? (
                              <Pressable
                                onPress={() => {
                                  setReplyingComment(
                                    comment
                                  );

                                  setReplyText(
                                    ""
                                  );
                                }}
                                className="flex-row items-center"
                              >
                                <Ionicons
                                  name="return-down-forward-outline"
                                  size={
                                    16
                                  }
                                  color="#475569"
                                />

                                <Text className="ml-2 text-sm font-semibold text-slate-600">
                                  Reply
                                </Text>
                              </Pressable>
                            ) : (
                              <View>
                                <TextInput
                                  value={
                                    replyText
                                  }
                                  onChangeText={
                                    setReplyText
                                  }
                                  placeholder="Write a reply..."
                                  placeholderTextColor="#94a3b8"
                                  multiline
                                  className="min-h-[90px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
                                  textAlignVertical="top"
                                />

                                <View className="mt-3 flex-row justify-end">
                                  <Pressable
                                    disabled={
                                      replyLoading
                                    }
                                    onPress={() => {
                                      setReplyingComment(
                                        null
                                      );

                                      setReplyText(
                                        ""
                                      );
                                    }}
                                    className="mr-2 rounded-xl bg-slate-100 px-4 py-3"
                                  >
                                    <Text className="text-sm font-semibold text-slate-600">
                                      Cancel
                                    </Text>
                                  </Pressable>

                                  <Pressable
                                    disabled={
                                      replyLoading
                                    }
                                    onPress={() =>
                                      replyToComment(
                                        comment
                                      )
                                    }
                                    className="rounded-xl bg-slate-900 px-4 py-3"
                                  >
                                    {replyLoading ? (
                                      <ActivityIndicator
                                        size="small"
                                        color="#ffffff"
                                      />
                                    ) : (
                                      <Text className="text-sm font-semibold text-white">
                                        Send Reply
                                      </Text>
                                    )}
                                  </Pressable>
                                </View>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    }
                  )
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}







































// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   Modal,
//   Platform,
//   Pressable,
//   RefreshControl,
//   ScrollView,
//   Text,
//   TextInput,
//   View,
// } from "react-native";

// import DateTimePicker from "@react-native-community/datetimepicker";
// import axios from "axios";

// import {
//   CalendarDays,
//   CheckCircle2,
//   ChevronDown,
//   ChevronLeft,
//   ChevronRight,
//   ChevronUp,
//   Clock3,
//   MessageCircle,
//   RefreshCw,
//   SendHorizontal,
//   Trash2,
//   X,
// } from "lucide-react-native";

// const API_URL = "https://realtorparth.ca";

// /* -------------------------------------------------------------------------- */
// /* Types                                                                      */
// /* -------------------------------------------------------------------------- */

// type SocialPlatform = "facebook" | "instagram" | "linkedin" | string;

// type ScheduledPost = {
//   _id?: string;
//   id?: string;

//   topic?: string;
//   caption?: string;

//   images?: string[];

//   platforms?: SocialPlatform[];

//   publishDate?: string;
//   scheduledDate?: string;
//   publishAt?: string;

//   status?: string;

//   createdAt?: string;
//   updatedAt?: string;

//   [key: string]: any;
// };

// type SocialComment = {
//   id?: string;
//   _id?: string;

//   commentId?: string;

//   message?: string;
//   text?: string;
//   comment?: string;

//   from?: any;
//   username?: string;
//   name?: string;

//   created_time?: string;
//   timestamp?: string;

//   [key: string]: any;
// };

// /* -------------------------------------------------------------------------- */
// /* Helpers                                                                    */
// /* -------------------------------------------------------------------------- */

// const getPostId = (post: ScheduledPost) => {
//   return String(post._id || post.id || "");
// };

// const getPostImages = (post: ScheduledPost): string[] => {
//   if (!Array.isArray(post.images)) {
//     return [];
//   }

//   return post.images.filter(
//     (image): image is string =>
//       typeof image === "string" && image.trim().length > 0
//   );
// };

// const getPublishDate = (post: ScheduledPost) => {
//   return (
//     post.publishDate ||
//     post.scheduledDate ||
//     post.publishAt ||
//     ""
//   );
// };

// const formatDate = (value?: string) => {
//   if (!value) {
//     return "Not scheduled";
//   }

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return value;
//   }

//   return date.toLocaleDateString("en-CA", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//   });
// };

// const formatTime = (value?: string) => {
//   if (!value) {
//     return "--";
//   }

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "--";
//   }

//   return date.toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const formatDateTime = (value?: string) => {
//   if (!value) {
//     return "Not scheduled";
//   }

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return value;
//   }

//   return `${date.toLocaleDateString("en-CA", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//   })} at ${date.toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//   })}`;
// };

// const getStatusLabel = (status?: string) => {
//   if (!status) {
//     return "Scheduled";
//   }

//   switch (status.toLowerCase()) {
//     case "published":
//       return "Published";

//     case "posted":
//       return "Posted";

//     case "failed":
//       return "Failed";

//     case "cancelled":
//     case "canceled":
//       return "Cancelled";

//     case "pending":
//       return "Pending";

//     case "scheduled":
//     default:
//       return "Scheduled";
//   }
// };

// const getStatusClass = (status?: string) => {
//   switch ((status || "scheduled").toLowerCase()) {
//     case "published":
//     case "posted":
//       return "bg-green-100";

//     case "failed":
//       return "bg-red-100";

//     case "cancelled":
//     case "canceled":
//       return "bg-gray-200";

//     case "pending":
//       return "bg-yellow-100";

//     default:
//       return "bg-blue-100";
//   }
// };

// const getStatusTextClass = (status?: string) => {
//   switch ((status || "scheduled").toLowerCase()) {
//     case "published":
//     case "posted":
//       return "text-green-700";

//     case "failed":
//       return "text-red-700";

//     case "cancelled":
//     case "canceled":
//       return "text-gray-700";

//     case "pending":
//       return "text-yellow-700";

//     default:
//       return "text-blue-700";
//   }
// };

// const getPlatformInitial = (platform: SocialPlatform) => {
//   switch (platform.toLowerCase()) {
//     case "facebook":
//       return "f";

//     case "instagram":
//       return "◎";

//     case "linkedin":
//       return "in";

//     default:
//       return platform.charAt(0).toUpperCase();
//   }
// };

// const getPlatformLabel = (platform: SocialPlatform) => {
//   switch (platform.toLowerCase()) {
//     case "facebook":
//       return "Facebook";

//     case "instagram":
//       return "Instagram";

//     case "linkedin":
//       return "LinkedIn";

//     default:
//       return platform;
//   }
// };

// /* -------------------------------------------------------------------------- */
// /* Platform Badge                                                             */
// /* -------------------------------------------------------------------------- */

// function PlatformBadge({
//   platform,
// }: {
//   platform: SocialPlatform;
// }) {
//   return (
//     <View className="mr-2 mb-2 flex-row items-center rounded-full bg-gray-100 px-3 py-2">
//       <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-gray-800">
//         <Text className="text-[10px] font-bold text-white">
//           {getPlatformInitial(platform)}
//         </Text>
//       </View>

//       <Text className="text-xs font-semibold text-gray-700">
//         {getPlatformLabel(platform)}
//       </Text>
//     </View>
//   );
// }

// /* -------------------------------------------------------------------------- */
// /* Main Screen                                                                */
// /* -------------------------------------------------------------------------- */

// export default function ScheduledPostScreen() {
//   const [posts, setPosts] = useState<ScheduledPost[]>([]);

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   const [selectedPost, setSelectedPost] =
//     useState<ScheduledPost | null>(null);

//   const [showDetailsModal, setShowDetailsModal] =
//     useState(false);

//   const [showEditModal, setShowEditModal] =
//     useState(false);

//   const [showCommentsModal, setShowCommentsModal] =
//     useState(false);

//   const [editingPost, setEditingPost] =
//     useState<ScheduledPost | null>(null);

//   const [nextSyncTime, setNextSyncTime] =
//     useState<Date | null>(null);

//   const [countdown, setCountdown] = useState(3);

//   /* ---------------------------------------------------------------------- */
//   /* Fetch Scheduled Posts                                                  */
//   /* ---------------------------------------------------------------------- */

//   const fetchScheduledPosts = useCallback(
//     async (showLoader = true) => {
//       try {
//         if (showLoader) {
//           setLoading(true);
//         }

//         const response = await axios.get(
//           `${API_URL}/api/socialpost/scheduled`
//         );

//         const responseData = response.data;

//         let fetchedPosts: ScheduledPost[] = [];

//         if (Array.isArray(responseData)) {
//           fetchedPosts = responseData;
//         } else if (Array.isArray(responseData?.posts)) {
//           fetchedPosts = responseData.posts;
//         } else if (
//           Array.isArray(responseData?.scheduledPosts)
//         ) {
//           fetchedPosts = responseData.scheduledPosts;
//         } else if (Array.isArray(responseData?.data)) {
//           fetchedPosts = responseData.data;
//         }

//         setPosts(fetchedPosts);

//         const syncDate = new Date(
//           Date.now() + 3000
//         );

//         setNextSyncTime(syncDate);
//         setCountdown(3);
//       } catch (error: any) {
//         console.error(
//           "Failed to fetch scheduled posts:",
//           error?.response?.data || error?.message || error
//         );

//         Alert.alert(
//           "Error",
//           "Unable to load scheduled posts."
//         );
//       } finally {
//         setLoading(false);
//         setRefreshing(false);
//       }
//     },
//     []
//   );

//   /* ---------------------------------------------------------------------- */
//   /* Server Time                                                            */
//   /* ---------------------------------------------------------------------- */

//   const fetchServerTime = useCallback(async () => {
//     try {
//       const response = await axios.get(
//         `${API_URL}/api/servertime`
//       );

//       const serverTime =
//         response.data?.serverTime ||
//         response.data?.time ||
//         response.data?.date;

//       if (serverTime) {
//         setNextSyncTime(
//           new Date(
//             new Date(serverTime).getTime() + 3000
//           )
//         );
//       }
//     } catch (error) {
//       console.log(
//         "Server time unavailable, using local time."
//       );
//     }
//   }, []);

//   /* ---------------------------------------------------------------------- */
//   /* Initial Load                                                           */
//   /* ---------------------------------------------------------------------- */

//   useEffect(() => {
//     fetchScheduledPosts();
//     fetchServerTime();
//   }, [fetchScheduledPosts, fetchServerTime]);

//   /* ---------------------------------------------------------------------- */
//   /* Auto Refresh                                                           */
//   /* ---------------------------------------------------------------------- */

//   // useEffect(() => {
//   //   const interval = setInterval(() => {
//   //     fetchScheduledPosts(false);
//   //   }, 3000);

//   //   return () => {
//   //     clearInterval(interval);
//   //   };
//   // }, [fetchScheduledPosts]);

//   /* ---------------------------------------------------------------------- */
//   /* Countdown                                                              */
//   /* ---------------------------------------------------------------------- */

//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (!nextSyncTime) {
//         return;
//       }

//       const remaining = Math.max(
//         0,
//         Math.ceil(
//           (nextSyncTime.getTime() - Date.now()) /
//             1000
//         )
//       );

//       setCountdown(remaining);

//       if (remaining <= 0) {
//         setNextSyncTime(
//           new Date(Date.now() + 3000)
//         );
//       }
//     }, 500);

//     return () => {
//       clearInterval(interval);
//     };
//   }, [nextSyncTime]);

//   /* ---------------------------------------------------------------------- */
//   /* Pull To Refresh                                                        */
//   /* ---------------------------------------------------------------------- */

//   const handleRefresh = async () => {
//     setRefreshing(true);

//     await fetchScheduledPosts(false);
//     await fetchServerTime();
//   };

//   /* ---------------------------------------------------------------------- */
//   /* Open Details                                                           */
//   /* ---------------------------------------------------------------------- */

//   const openDetails = (post: ScheduledPost) => {
//     setSelectedPost(post);
//     setShowDetailsModal(true);
//   };

//   /* ---------------------------------------------------------------------- */
//   /* Edit                                                                   */
//   /* ---------------------------------------------------------------------- */

//   const openEdit = (post: ScheduledPost) => {
//     setEditingPost({
//       ...post,
//       topic: post.topic || "",
//       caption: post.caption || "",
//       images: getPostImages(post),
//       publishDate: getPublishDate(post),
//     });

//     setShowDetailsModal(false);
//     setShowEditModal(true);
//   };

//   /* ---------------------------------------------------------------------- */
//   /* Delete / Cancel                                                        */
//   /* ---------------------------------------------------------------------- */

//   const handleDelete = (post: ScheduledPost) => {
//     const postId = getPostId(post);

//     if (!postId) {
//       Alert.alert(
//         "Error",
//         "Unable to identify this post."
//       );
//       return;
//     }

//     Alert.alert(
//       "Cancel Scheduled Post",
//       "Are you sure you want to cancel this scheduled post?",
//       [
//         {
//           text: "No",
//           style: "cancel",
//         },
//         {
//           text: "Yes, Cancel",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               await axios.delete(
//                 `${API_URL}/api/socialpost/${postId}`
//               );

//               setShowDetailsModal(false);
//               setSelectedPost(null);

//               await fetchScheduledPosts(false);

//               Alert.alert(
//                 "Success",
//                 "Scheduled post cancelled successfully."
//               );
//             } catch (error: any) {
//               console.error(
//                 "Delete scheduled post error:",
//                 error?.response?.data || error
//               );

//               Alert.alert(
//                 "Error",
//                 error?.response?.data?.message ||
//                   "Unable to cancel scheduled post."
//               );
//             }
//           },
//         },
//       ]
//     );
//   };

//   /* ---------------------------------------------------------------------- */
//   /* Remove Posted                                                          */
//   /* ---------------------------------------------------------------------- */

//   const handleRemovePosted = (post: ScheduledPost) => {
//     const postId = getPostId(post);

//     if (!postId) {
//       Alert.alert(
//         "Error",
//         "Unable to identify this post."
//       );
//       return;
//     }

//     Alert.alert(
//       "Remove Posted Post",
//       "Are you sure you want to remove this post?",
//       [
//         {
//           text: "No",
//           style: "cancel",
//         },
//         {
//           text: "Remove",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               await axios.post(
//                 `${API_URL}/api/socialpost/remove/${postId}`
//               );

//               setShowDetailsModal(false);
//               setSelectedPost(null);

//               await fetchScheduledPosts(false);

//               Alert.alert(
//                 "Success",
//                 "Post removed successfully."
//               );
//             } catch (error: any) {
//               console.error(
//                 "Remove posted post error:",
//                 error?.response?.data || error
//               );

//               Alert.alert(
//                 "Error",
//                 error?.response?.data?.message ||
//                   "Unable to remove post."
//               );
//             }
//           },
//         },
//       ]
//     );
//   };

//   /* ---------------------------------------------------------------------- */
//   /* Stats                                                                   */
//   /* ---------------------------------------------------------------------- */

//   const stats = useMemo(() => {
//     const scheduled = posts.filter(
//       (post) =>
//         !["published", "posted", "cancelled", "canceled"].includes(
//           (post.status || "scheduled").toLowerCase()
//         )
//     ).length;

//     const published = posts.filter(
//       (post) =>
//         ["published", "posted"].includes(
//           (post.status || "").toLowerCase()
//         )
//     ).length;

//     const failed = posts.filter(
//       (post) =>
//         (post.status || "").toLowerCase() === "failed"
//     ).length;

//     return {
//       total: posts.length,
//       scheduled,
//       published,
//       failed,
//     };
//   }, [posts]);

//   /* ---------------------------------------------------------------------- */
//   /* Loading                                                                 */
//   /* ---------------------------------------------------------------------- */

//   if (loading) {
//     return (
//       <View className="flex-1 items-center justify-center bg-gray-100">
//         <ActivityIndicator
//           size="large"
//           color="#111827"
//         />

//         <Text className="mt-4 text-sm text-gray-500">
//           Loading scheduled posts...
//         </Text>
//       </View>
//     );
//   }

//   /* ---------------------------------------------------------------------- */
//   /* Render                                                                  */
//   /* ---------------------------------------------------------------------- */

//   return (
//     <View className="flex-1 bg-gray-100">
//       <ScrollView
//         className="flex-1"
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//           />
//         }
//         contentContainerStyle={{
//           padding: 20,
//           paddingBottom: 40,
//         }}
//       >
//         {/* Header */}
//         <View className="mb-5">
//           <Text className="text-2xl font-bold text-gray-900">
//             Scheduled Social Posts
//           </Text>

//           <Text className="mt-1 text-sm leading-5 text-gray-500">
//             Manage pending and published social media
//             posts
//           </Text>
//         </View>

//         {/* Auto Refresh */}
//         {/* <View className="mb-5 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
//           <View className="flex-row items-center">
//             <RefreshCw
//               size={17}
//               color="#6b7280"
//             />

//             <Text className="ml-2 text-sm text-gray-600">
//               Auto refresh
//             </Text>
//           </View>

//           <Text className="text-sm font-semibold text-gray-900">
//             {countdown}s
//           </Text>
//         </View> */}

//         {/* Stats */}
//         <View className="mb-5 flex-row flex-wrap justify-between">
//           <StatCard
//             title="Total"
//             value={stats.total}
//           />

//           <StatCard
//             title="Scheduled"
//             value={stats.scheduled}
//           />

//           <StatCard
//             title="Published"
//             value={stats.published}
//           />

//           <StatCard
//             title="Failed"
//             value={stats.failed}
//           />
//         </View>

//         {/* Empty State */}
//         {posts.length === 0 ? (
//           <View className="items-center rounded-2xl border border-gray-200 bg-white px-6 py-12">
//             <CalendarDays
//               size={42}
//               color="#9ca3af"
//             />

//             <Text className="mt-4 text-lg font-bold text-gray-900">
//               No Scheduled Posts
//             </Text>

//             <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
//               There are currently no scheduled social
//               media posts.
//             </Text>

//             <Pressable
//               onPress={() =>
//                 fetchScheduledPosts()
//               }
//               className="mt-5 flex-row items-center rounded-xl bg-gray-900 px-5 py-3"
//             >
//               <RefreshCw
//                 size={16}
//                 color="#ffffff"
//               />

//               <Text className="ml-2 font-semibold text-white">
//                 Refresh
//               </Text>
//             </Pressable>
//           </View>
//         ) : (
//           <View>
//             {posts.map((post, index) => (
//               <ScheduledPostCard
//                 key={`${getPostId(post)}-${index}`}
//                 post={post}
//                 onPress={() => openDetails(post)}
//               />
//             ))}
//           </View>
//         )}
//       </ScrollView>

//       {/* ---------------------------------------------------------------- */}
//       {/* Details Modal                                                     */}
//       {/* ---------------------------------------------------------------- */}

//       <Modal
//         visible={showDetailsModal}
//         transparent
//         animationType="slide"
//         onRequestClose={() =>
//           setShowDetailsModal(false)
//         }
//       >
//         {selectedPost && (
//           <PostDetailsModal
//             post={selectedPost}
//             onClose={() =>
//               setShowDetailsModal(false)
//             }
//             onEdit={() =>
//               openEdit(selectedPost)
//             }
//             onDelete={() =>
//               handleDelete(selectedPost)
//             }
//             onRemovePosted={() =>
//               handleRemovePosted(selectedPost)
//             }
//             onComments={() => {
//               setShowCommentsModal(true);
//             }}
//           />
//         )}
//       </Modal>

//       {/* ---------------------------------------------------------------- */}
//       {/* Edit Modal                                                        */}
//       {/* ---------------------------------------------------------------- */}

//       <Modal
//         visible={showEditModal}
//         transparent
//         animationType="slide"
//         onRequestClose={() =>
//           setShowEditModal(false)
//         }
//       >
//         {editingPost && (
//           <EditPostModal
//             post={editingPost}
//             onClose={() =>
//               setShowEditModal(false)
//             }
//             onSaved={async () => {
//               setShowEditModal(false);
//               setEditingPost(null);
//               await fetchScheduledPosts(false);
//             }}
//           />
//         )}
//       </Modal>

//       {/* ---------------------------------------------------------------- */}
//       {/* Comments Modal                                                    */}
//       {/* ---------------------------------------------------------------- */}

//       <Modal
//         visible={showCommentsModal}
//         transparent
//         animationType="slide"
//         onRequestClose={() =>
//           setShowCommentsModal(false)
//         }
//       >
//         {selectedPost && (
//           <CommentsModal
//             post={selectedPost}
//             onClose={() =>
//               setShowCommentsModal(false)
//             }
//           />
//         )}
//       </Modal>
//     </View>
//   );
// }

// /* ========================================================================== */
// /* Stat Card                                                                  */
// /* ========================================================================== */

// function StatCard({
//   title,
//   value,
// }: {
//   title: string;
//   value: number;
// }) {
//   return (
//     <View className="mb-3 w-[48%] rounded-2xl border border-gray-200 bg-white p-4">
//       <Text className="text-xs font-medium text-gray-500">
//         {title}
//       </Text>

//       <Text className="mt-2 text-2xl font-bold text-gray-900">
//         {value}
//       </Text>
//     </View>
//   );
// }

// /* ========================================================================== */
// /* Scheduled Post Card                                                        */
// /* ========================================================================== */

// function ScheduledPostCard({
//   post,
//   onPress,
// }: {
//   post: ScheduledPost;
//   onPress: () => void;
// }) {
//   const images = getPostImages(post);
//   const publishDate = getPublishDate(post);

//   const platforms = Array.isArray(post.platforms)
//     ? post.platforms
//     : [];

//   return (
//     <Pressable
//       onPress={onPress}
//       className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white active:opacity-80"
//     >
//       {/* Image */}
//       {images.length > 0 ? (
//         <Image
//           source={{
//             uri: images[0],
//           }}
//           className="h-48 w-full"
//           resizeMode="cover"
//         />
//       ) : (
//         <View className="h-40 items-center justify-center bg-gray-100">
//           <CalendarDays
//             size={36}
//             color="#9ca3af"
//           />

//           <Text className="mt-2 text-xs text-gray-400">
//             No image
//           </Text>
//         </View>
//       )}

//       <View className="p-4">
//         {/* Topic + Status */}
//         <View className="flex-row items-start justify-between">
//           <View className="mr-3 flex-1">
//             <Text
//               numberOfLines={2}
//               className="text-lg font-bold text-gray-900"
//             >
//               {post.topic || "Untitled Post"}
//             </Text>
//           </View>

//           <View
//             className={`rounded-full px-3 py-1.5 ${getStatusClass(
//               post.status
//             )}`}
//           >
//             <Text
//               className={`text-xs font-bold ${getStatusTextClass(
//                 post.status
//               )}`}
//             >
//               {getStatusLabel(post.status)}
//             </Text>
//           </View>
//         </View>

//         {/* Caption */}
//         {!!post.caption && (
//           <Text
//             numberOfLines={3}
//             className="mt-3 text-sm leading-5 text-gray-600"
//           >
//             {post.caption}
//           </Text>
//         )}

//         {/* Schedule */}
//         <View className="mt-4 rounded-xl bg-gray-50 p-3">
//           <View className="flex-row items-center">
//             <CalendarDays
//               size={16}
//               color="#6b7280"
//             />

//             <Text className="ml-2 text-sm font-semibold text-gray-700">
//               {formatDate(publishDate)}
//             </Text>
//           </View>

//           <View className="mt-2 flex-row items-center">
//             <Clock3
//               size={16}
//               color="#6b7280"
//             />

//             <Text className="ml-2 text-sm text-gray-600">
//               {formatTime(publishDate)}
//             </Text>
//           </View>
//         </View>

//         {/* Platforms */}
//         {platforms.length > 0 && (
//           <View className="mt-4 flex-row flex-wrap">
//             {platforms.map((platform, index) => (
//               <PlatformBadge
//                 key={`${platform}-${index}`}
//                 platform={platform}
//               />
//             ))}
//           </View>
//         )}

//         {/* Footer */}
//         <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
//           <Text className="text-xs text-gray-400">
//             {images.length}{" "}
//             {images.length === 1
//               ? "image"
//               : "images"}
//           </Text>

//           <View className="flex-row items-center">
//             <Text className="mr-1 text-sm font-semibold text-gray-700">
//               View details
//             </Text>

//             <ChevronRight
//               size={17}
//               color="#374151"
//             />
//           </View>
//         </View>
//       </View>
//     </Pressable>
//   );
// }

// /* ========================================================================== */
// /* Post Details Modal                                                         */
// /* ========================================================================== */

// function PostDetailsModal({
//   post,
//   onClose,
//   onEdit,
//   onDelete,
//   onRemovePosted,
//   onComments,
// }: {
//   post: ScheduledPost;
//   onClose: () => void;
//   onEdit: () => void;
//   onDelete: () => void;
//   onRemovePosted: () => void;
//   onComments: () => void;
// }) {
//   const images = getPostImages(post);

//   const platforms = Array.isArray(post.platforms)
//     ? post.platforms
//     : [];

//   const [imageIndex, setImageIndex] =
//     useState(0);

//   const status = (
//     post.status || "scheduled"
//   ).toLowerCase();

//   const isPosted =
//     status === "published" ||
//     status === "posted";

//   const currentImage =
//     images[imageIndex] || null;

//   return (
//     <View className="flex-1 justify-end bg-black/50">
//       <View className="max-h-[92%] rounded-t-3xl bg-gray-100">
//         {/* Header */}
//         <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
//           <Text className="flex-1 text-xl font-bold text-gray-900">
//             Post Details
//           </Text>

//           <Pressable
//             onPress={onClose}
//             className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
//           >
//             <X
//               size={21}
//               color="#374151"
//             />
//           </Pressable>
//         </View>

//         <ScrollView
//           contentContainerStyle={{
//             padding: 20,
//             paddingBottom: 35,
//           }}
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Image */}
//           {currentImage ? (
//             <View className="overflow-hidden rounded-2xl bg-black">
//               <Image
//                 source={{
//                   uri: currentImage,
//                 }}
//                 className="h-72 w-full"
//                 resizeMode="contain"
//               />

//               {images.length > 1 && (
//                 <>
//                   <Pressable
//                     disabled={imageIndex === 0}
//                     onPress={() =>
//                       setImageIndex(
//                         Math.max(
//                           0,
//                           imageIndex - 1
//                         )
//                       )
//                     }
//                     className="absolute left-3 top-1/2 h-10 w-10 -translate-y-5 items-center justify-center rounded-full bg-white/90"
//                   >
//                     <ChevronLeft
//                       size={21}
//                       color="#111827"
//                     />
//                   </Pressable>

//                   <Pressable
//                     disabled={
//                       imageIndex ===
//                       images.length - 1
//                     }
//                     onPress={() =>
//                       setImageIndex(
//                         Math.min(
//                           images.length - 1,
//                           imageIndex + 1
//                         )
//                       )
//                     }
//                     className="absolute right-3 top-1/2 h-10 w-10 -translate-y-5 items-center justify-center rounded-full bg-white/90"
//                   >
//                     <ChevronRight
//                       size={21}
//                       color="#111827"
//                     />
//                   </Pressable>

//                   <View className="absolute bottom-3 left-0 right-0 items-center">
//                     <View className="rounded-full bg-black/70 px-3 py-1">
//                       <Text className="text-xs font-semibold text-white">
//                         {imageIndex + 1} /{" "}
//                         {images.length}
//                       </Text>
//                     </View>
//                   </View>
//                 </>
//               )}
//             </View>
//           ) : (
//             <View className="h-56 items-center justify-center rounded-2xl bg-gray-200">
//               <CalendarDays
//                 size={40}
//                 color="#9ca3af"
//               />

//               <Text className="mt-3 text-sm text-gray-500">
//                 No image available
//               </Text>
//             </View>
//           )}

//           {/* Topic */}
//           <View className="mt-5 rounded-2xl bg-white p-5">
//             <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
//               Topic
//             </Text>

//             <Text className="mt-2 text-xl font-bold text-gray-900">
//               {post.topic || "Untitled Post"}
//             </Text>
//           </View>

//           {/* Status */}
//           <View className="mt-3 rounded-2xl bg-white p-5">
//             <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
//               Status
//             </Text>

//             <View className="mt-3 flex-row items-center">
//               <View
//                 className={`mr-2 h-9 w-9 items-center justify-center rounded-full ${getStatusClass(
//                   post.status
//                 )}`}
//               >
//                 <CheckCircle2
//                   size={18}
//                   color="#374151"
//                 />
//               </View>

//               <Text
//                 className={`text-base font-bold ${getStatusTextClass(
//                   post.status
//                 )}`}
//               >
//                 {getStatusLabel(post.status)}
//               </Text>
//             </View>
//           </View>

//           {/* Schedule */}
//           <View className="mt-3 rounded-2xl bg-white p-5">
//             <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
//               Schedule
//             </Text>

//             <View className="mt-4 flex-row">
//               <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
//                 <CalendarDays
//                   size={19}
//                   color="#374151"
//                 />
//               </View>

//               <View className="flex-1">
//                 <Text className="text-sm font-semibold text-gray-900">
//                   {formatDate(
//                     getPublishDate(post)
//                   )}
//                 </Text>

//                 <Text className="mt-1 text-sm text-gray-500">
//                   {formatTime(
//                     getPublishDate(post)
//                   )}
//                 </Text>
//               </View>
//             </View>
//           </View>

//           {/* Platforms */}
//           {platforms.length > 0 && (
//             <View className="mt-3 rounded-2xl bg-white p-5">
//               <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
//                 Platforms
//               </Text>

//               <View className="mt-4 flex-row flex-wrap">
//                 {platforms.map(
//                   (platform, index) => (
//                     <PlatformBadge
//                       key={`${platform}-${index}`}
//                       platform={platform}
//                     />
//                   )
//                 )}
//               </View>
//             </View>
//           )}

//           {/* Caption */}
//           <View className="mt-3 rounded-2xl bg-white p-5">
//             <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
//               Caption
//             </Text>

//             <Text className="mt-3 text-sm leading-6 text-gray-700">
//               {post.caption ||
//                 "No caption available."}
//             </Text>
//           </View>

//           {/* Actions */}
//           <View className="mt-5">
//             {!isPosted && (
//               <Pressable
//                 onPress={onEdit}
//                 className="mb-3 flex-row items-center justify-center rounded-xl bg-gray-900 px-5 py-4"
//               >
//                 <Text className="font-bold text-white">
//                   Edit Scheduled Post
//                 </Text>
//               </Pressable>
//             )}

//             <Pressable
//               onPress={onComments}
//               className="mb-3 flex-row items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-4"
//             >
//               <MessageCircle
//                 size={18}
//                 color="#374151"
//               />

//               <Text className="ml-2 font-bold text-gray-800">
//                 View Comments
//               </Text>
//             </Pressable>

//             {isPosted ? (
//               <Pressable
//                 onPress={onRemovePosted}
//                 className="flex-row items-center justify-center rounded-xl bg-red-600 px-5 py-4"
//               >
//                 <Trash2
//                   size={18}
//                   color="#ffffff"
//                 />

//                 <Text className="ml-2 font-bold text-white">
//                   Remove Posted Post
//                 </Text>
//               </Pressable>
//             ) : (
//               <Pressable
//                 onPress={onDelete}
//                 className="flex-row items-center justify-center rounded-xl bg-red-600 px-5 py-4"
//               >
//                 <Trash2
//                   size={18}
//                   color="#ffffff"
//                 />

//                 <Text className="ml-2 font-bold text-white">
//                   Cancel Scheduled Post
//                 </Text>
//               </Pressable>
//             )}
//           </View>
//         </ScrollView>
//       </View>
//     </View>
//   );
// }

// /* ========================================================================== */
// /* Edit Modal                                                                 */
// /* ========================================================================== */

// function EditPostModal({
//   post,
//   onClose,
//   onSaved,
// }: {
//   post: ScheduledPost;
//   onClose: () => void;
//   onSaved: () => Promise<void>;
// }) {
//   const [topic, setTopic] = useState(
//     post.topic || ""
//   );

//   const [caption, setCaption] = useState(
//     post.caption || ""
//   );

//   const [publishDate, setPublishDate] =
//     useState(
//       post.publishDate ||
//         getPublishDate(post) ||
//         new Date().toISOString()
//     );

//   const [saving, setSaving] =
//     useState(false);

//   const [showDatePicker, setShowDatePicker] =
//     useState(false);

//   const [showTimePicker, setShowTimePicker] =
//     useState(false);

//   const currentDate = useMemo(() => {
//     const parsed = new Date(publishDate);

//     if (Number.isNaN(parsed.getTime())) {
//       return new Date();
//     }

//     return parsed;
//   }, [publishDate]);

//   const postId = getPostId(post);

//   /* ---------------------------------------------------------------------- */
//   /* Save                                                                   */
//   /* ---------------------------------------------------------------------- */

//   const handleSave = async () => {
//     if (!postId) {
//       Alert.alert(
//         "Error",
//         "Unable to identify this post."
//       );
//       return;
//     }

//     if (!topic.trim()) {
//       Alert.alert(
//         "Validation",
//         "Please enter a topic."
//       );
//       return;
//     }

//     if (!caption.trim()) {
//       Alert.alert(
//         "Validation",
//         "Please enter a caption."
//       );
//       return;
//     }

//     try {
//       setSaving(true);

//       await axios.post(
//         `${API_URL}/api/socialpost/edit/${postId}`,
//         {
//           topic: topic.trim(),
//           caption: caption.trim(),
//           images: getPostImages(post),
//           publishDate,
//         }
//       );

//       Alert.alert(
//         "Success",
//         "Scheduled post updated successfully.",
//         [
//           {
//             text: "OK",
//             onPress: async () => {
//               await onSaved();
//             },
//           },
//         ]
//       );
//     } catch (error: any) {
//       console.error(
//         "Edit scheduled post error:",
//         error?.response?.data || error
//       );

//       Alert.alert(
//         "Error",
//         error?.response?.data?.message ||
//           "Unable to update scheduled post."
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* ---------------------------------------------------------------------- */
//   /* Date Picker                                                            */
//   /* ---------------------------------------------------------------------- */

//   const handleDateChange = (
//     event: any,
//     selected?: Date
//   ) => {
//     if (Platform.OS === "android") {
//       setShowDatePicker(false);
//     }

//     if (!selected) {
//       return;
//     }

//     const nextDate = new Date(currentDate);

//     nextDate.setFullYear(
//       selected.getFullYear()
//     );

//     nextDate.setMonth(
//       selected.getMonth()
//     );

//     nextDate.setDate(
//       selected.getDate()
//     );

//     setPublishDate(
//       nextDate.toISOString()
//     );

//     if (Platform.OS === "android") {
//       setShowTimePicker(true);
//     }
//   };

//   /* ---------------------------------------------------------------------- */
//   /* Time Picker                                                            */
//   /* ---------------------------------------------------------------------- */

//   const handleTimeChange = (
//     event: any,
//     selected?: Date
//   ) => {
//     if (Platform.OS === "android") {
//       setShowTimePicker(false);
//     }

//     if (!selected) {
//       return;
//     }

//     const nextDate = new Date(currentDate);

//     nextDate.setHours(
//       selected.getHours()
//     );

//     nextDate.setMinutes(
//       selected.getMinutes()
//     );

//     setPublishDate(
//       nextDate.toISOString()
//     );
//   };

//   return (
//     <View className="flex-1 justify-end bg-black/50">
//       <View className="max-h-[92%] rounded-t-3xl bg-gray-100">
//         {/* Header */}
//         <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
//           <Text className="text-xl font-bold text-gray-900">
//             Edit Scheduled Post
//           </Text>

//           <Pressable
//             onPress={onClose}
//             disabled={saving}
//             className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
//           >
//             <X
//               size={21}
//               color="#374151"
//             />
//           </Pressable>
//         </View>

//         <ScrollView
//           contentContainerStyle={{
//             padding: 20,
//             paddingBottom: 40,
//           }}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Topic */}
//           <View className="rounded-2xl bg-white p-5">
//             <Text className="mb-2 text-sm font-bold text-gray-800">
//               Topic
//             </Text>

//             <TextInput
//               value={topic}
//               onChangeText={setTopic}
//               placeholder="Enter topic"
//               placeholderTextColor="#9ca3af"
//               className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
//             />
//           </View>

//           {/* Caption */}
//           <View className="mt-4 rounded-2xl bg-white p-5">
//             <Text className="mb-2 text-sm font-bold text-gray-800">
//               Caption
//             </Text>

//             <TextInput
//               value={caption}
//               onChangeText={setCaption}
//               placeholder="Enter caption"
//               placeholderTextColor="#9ca3af"
//               multiline
//               textAlignVertical="top"
//               className="min-h-[150px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
//             />
//           </View>

//           {/* Schedule */}
//           <View className="mt-4 rounded-2xl bg-white p-5">
//             <Text className="mb-3 text-sm font-bold text-gray-800">
//               Publish Date & Time
//             </Text>

//             <View className="flex-row">
//               <Pressable
//                 onPress={() =>
//                   setShowDatePicker(true)
//                 }
//                 className="mr-2 flex-1 rounded-xl border border-gray-200 bg-gray-50 p-4"
//               >
//                 <View className="flex-row items-center">
//                   <CalendarDays
//                     size={18}
//                     color="#374151"
//                   />

//                   <Text className="ml-2 text-xs font-semibold text-gray-500">
//                     Date
//                   </Text>
//                 </View>

//                 <Text className="mt-2 text-sm font-bold text-gray-900">
//                   {formatDate(publishDate)}
//                 </Text>
//               </Pressable>

//               <Pressable
//                 onPress={() =>
//                   setShowTimePicker(true)
//                 }
//                 className="ml-2 flex-1 rounded-xl border border-gray-200 bg-gray-50 p-4"
//               >
//                 <View className="flex-row items-center">
//                   <Clock3
//                     size={18}
//                     color="#374151"
//                   />

//                   <Text className="ml-2 text-xs font-semibold text-gray-500">
//                     Time
//                   </Text>
//                 </View>

//                 <Text className="mt-2 text-sm font-bold text-gray-900">
//                   {formatTime(publishDate)}
//                 </Text>
//               </Pressable>
//             </View>
//           </View>

//           {/* Images */}
//           {getPostImages(post).length >
//             0 && (
//             <View className="mt-4 rounded-2xl bg-white p-5">
//               <Text className="mb-3 text-sm font-bold text-gray-800">
//                 Images
//               </Text>

//               <ScrollView
//                 horizontal
//                 showsHorizontalScrollIndicator={
//                   false
//                 }
//               >
//                 {getPostImages(post).map(
//                   (image, index) => (
//                     <Image
//                       key={`${image}-${index}`}
//                       source={{
//                         uri: image,
//                       }}
//                       className="mr-3 h-24 w-24 rounded-xl"
//                       resizeMode="cover"
//                     />
//                   )
//                 )}
//               </ScrollView>
//             </View>
//           )}

//           {/* Save */}
//           <Pressable
//             onPress={handleSave}
//             disabled={saving}
//             className={`mt-5 flex-row items-center justify-center rounded-xl px-5 py-4 ${
//               saving
//                 ? "bg-gray-400"
//                 : "bg-gray-900"
//             }`}
//           >
//             {saving ? (
//               <ActivityIndicator
//                 size="small"
//                 color="#ffffff"
//               />
//             ) : (
//               <SendHorizontal
//                 size={18}
//                 color="#ffffff"
//               />
//             )}

//             <Text className="ml-2 font-bold text-white">
//               {saving
//                 ? "Saving..."
//                 : "Save Changes"}
//             </Text>
//           </Pressable>
//         </ScrollView>

//         {/* Android Date Picker */}
//         {showDatePicker && (
//           <DateTimePicker
//             value={currentDate}
//             mode="date"
//             display={
//               Platform.OS === "ios"
//                 ? "spinner"
//                 : "default"
//             }
//             onChange={handleDateChange}
//           />
//         )}

//         {/* Android / iOS Time Picker */}
//         {showTimePicker && (
//           <DateTimePicker
//             value={currentDate}
//             mode="time"
//             display={
//               Platform.OS === "ios"
//                 ? "spinner"
//                 : "default"
//             }
//             onChange={handleTimeChange}
//           />
//         )}
//       </View>
//     </View>
//   );
// }

// /* ========================================================================== */
// /* Comments Modal                                                             */
// /* ========================================================================== */

// function CommentsModal({
//   post,
//   onClose,
// }: {
//   post: ScheduledPost;
//   onClose: () => void;
// }) {
//   const platforms = Array.isArray(post.platforms)
//     ? post.platforms
//     : [];

//   const supportedPlatforms =
//     platforms.filter((platform) =>
//       ["facebook", "instagram"].includes(
//         platform.toLowerCase()
//       )
//     );

//   const [selectedPlatform, setSelectedPlatform] =
//     useState<SocialPlatform>(
//       supportedPlatforms[0] ||
//         platforms[0] ||
//         "facebook"
//     );

//   const [comments, setComments] =
//     useState<SocialComment[]>([]);

//   const [loading, setLoading] =
//     useState(false);

//   const [replyText, setReplyText] =
//     useState("");

//   const [replyingTo, setReplyingTo] =
//     useState<string | null>(null);

//   const [sending, setSending] =
//     useState(false);

//   const postId = getPostId(post);

//   /* ---------------------------------------------------------------------- */
//   /* Fetch Comments                                                         */
//   /* ---------------------------------------------------------------------- */

//   const fetchComments = useCallback(
//     async () => {
//       if (!postId) {
//         return;
//       }

//       try {
//         setLoading(true);

//         const response = await axios.post(
//           `${API_URL}/api/social-comments/list`,
//           {
//             platform: selectedPlatform,
//             postId,
//           }
//         );

//         const responseData =
//           response.data;

//         let fetchedComments: SocialComment[] =
//           [];

//         if (Array.isArray(responseData)) {
//           fetchedComments = responseData;
//         } else if (
//           Array.isArray(responseData?.comments)
//         ) {
//           fetchedComments =
//             responseData.comments;
//         } else if (
//           Array.isArray(responseData?.data)
//         ) {
//           fetchedComments =
//             responseData.data;
//         }

//         setComments(fetchedComments);
//       } catch (error: any) {
//         console.error(
//           "Fetch comments error:",
//           error?.response?.data || error
//         );

//         Alert.alert(
//           "Error",
//           "Unable to load comments."
//         );
//       } finally {
//         setLoading(false);
//       }
//     },
//     [postId, selectedPlatform]
//   );

//   useEffect(() => {
//     fetchComments();
//   }, [fetchComments]);

//   /* ---------------------------------------------------------------------- */
//   /* Reply                                                                  */
//   /* ---------------------------------------------------------------------- */

//   const handleReply = async (
//     comment: SocialComment
//   ) => {
//     const commentId = String(
//       comment.commentId ||
//         comment._id ||
//         comment.id ||
//         ""
//     );

//     if (!commentId) {
//       Alert.alert(
//         "Error",
//         "Unable to identify comment."
//       );
//       return;
//     }

//     if (!replyText.trim()) {
//       Alert.alert(
//         "Validation",
//         "Please enter a reply."
//       );
//       return;
//     }

//     try {
//       setSending(true);

//       await axios.post(
//         `${API_URL}/api/social-comments/reply`,
//         {
//           platform: selectedPlatform,
//           postId,
//           commentId,
//           message: replyText.trim(),
//         }
//       );

//       setReplyText("");
//       setReplyingTo(null);

//       await fetchComments();

//       Alert.alert(
//         "Success",
//         "Reply sent successfully."
//       );
//     } catch (error: any) {
//       console.error(
//         "Reply comment error:",
//         error?.response?.data || error
//       );

//       Alert.alert(
//         "Error",
//         error?.response?.data?.message ||
//           "Unable to send reply."
//       );
//     } finally {
//       setSending(false);
//     }
//   };

//   /* ---------------------------------------------------------------------- */
//   /* Delete Comment                                                         */
//   /* ---------------------------------------------------------------------- */

//   const handleDeleteComment = (
//     comment: SocialComment
//   ) => {
//     const commentId = String(
//       comment.commentId ||
//         comment._id ||
//         comment.id ||
//         ""
//     );

//     if (!commentId) {
//       return;
//     }

//     Alert.alert(
//       "Delete Comment",
//       "Are you sure you want to delete this comment?",
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               await axios.post(
//                 `${API_URL}/api/social-comments/delete`,
//                 {
//                   platform:
//                     selectedPlatform,
//                   commentId,
//                 }
//               );

//               await fetchComments();
//             } catch (error: any) {
//               console.error(
//                 "Delete comment error:",
//                 error?.response?.data ||
//                   error
//               );

//               Alert.alert(
//                 "Error",
//                 error?.response?.data
//                   ?.message ||
//                   "Unable to delete comment."
//               );
//             }
//           },
//         },
//       ]
//     );
//   };

//   /* ---------------------------------------------------------------------- */
//   /* Comment Helpers                                                        */
//   /* ---------------------------------------------------------------------- */

//   const getCommentText = (
//     comment: SocialComment
//   ) => {
//     return (
//       comment.message ||
//       comment.text ||
//       comment.comment ||
//       ""
//     );
//   };

//   const getCommentAuthor = (
//     comment: SocialComment
//   ) => {
//     if (
//       typeof comment.from === "string"
//     ) {
//       return comment.from;
//     }

//     if (comment.from?.name) {
//       return comment.from.name;
//     }

//     return (
//       comment.name ||
//       comment.username ||
//       "User"
//     );
//   };

//   return (
//     <View className="flex-1 justify-end bg-black/50">
//       <View className="max-h-[92%] rounded-t-3xl bg-gray-100">
//         {/* Header */}
//         <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
//           <View className="flex-1">
//             <Text className="text-xl font-bold text-gray-900">
//               Comments
//             </Text>

//             <Text className="mt-1 text-xs text-gray-500">
//               {post.topic ||
//                 "Scheduled Post"}
//             </Text>
//           </View>

//           <Pressable
//             onPress={onClose}
//             className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
//           >
//             <X
//               size={21}
//               color="#374151"
//             />
//           </Pressable>
//         </View>

//         {/* Platforms */}
//         {supportedPlatforms.length > 0 && (
//           <ScrollView
//             horizontal
//             showsHorizontalScrollIndicator={
//               false
//             }
//             className="max-h-20 bg-white"
//             contentContainerStyle={{
//               paddingHorizontal: 20,
//               paddingVertical: 12,
//             }}
//           >
//             {supportedPlatforms.map(
//               (platform) => {
//                 const active =
//                   platform.toLowerCase() ===
//                   selectedPlatform.toLowerCase();

//                 return (
//                   <Pressable
//                     key={platform}
//                     onPress={() =>
//                       setSelectedPlatform(
//                         platform
//                       )
//                     }
//                     className={`mr-2 rounded-xl px-4 py-3 ${
//                       active
//                         ? "bg-gray-900"
//                         : "bg-gray-100"
//                     }`}
//                   >
//                     <Text
//                       className={`text-sm font-semibold ${
//                         active
//                           ? "text-white"
//                           : "text-gray-700"
//                       }`}
//                     >
//                       {getPlatformLabel(
//                         platform
//                       )}
//                     </Text>
//                   </Pressable>
//                 );
//               }
//             )}
//           </ScrollView>
//         )}

//         {/* Comments */}
//         <ScrollView
//           className="flex-1"
//           contentContainerStyle={{
//             padding: 20,
//             paddingBottom: 40,
//           }}
//           showsVerticalScrollIndicator={false}
//         >
//           {loading ? (
//             <View className="items-center py-10">
//               <ActivityIndicator
//                 size="large"
//                 color="#111827"
//               />

//               <Text className="mt-3 text-sm text-gray-500">
//                 Loading comments...
//               </Text>
//             </View>
//           ) : comments.length === 0 ? (
//             <View className="items-center rounded-2xl bg-white px-5 py-10">
//               <MessageCircle
//                 size={40}
//                 color="#9ca3af"
//               />

//               <Text className="mt-3 text-base font-bold text-gray-900">
//                 No comments
//               </Text>

//               <Text className="mt-1 text-center text-sm text-gray-500">
//                 No comments were found for this
//                 platform.
//               </Text>
//             </View>
//           ) : (
//             comments.map(
//               (comment, index) => {
//                 const commentId =
//                   String(
//                     comment.commentId ||
//                       comment._id ||
//                       comment.id ||
//                       index
//                   );

//                 const isReplying =
//                   replyingTo ===
//                   commentId;

//                 const commentDate =
//                   comment.created_time ||
//                   comment.timestamp;

//                 return (
//                   <View
//                     key={`${commentId}-${index}`}
//                     className="mb-3 rounded-2xl bg-white p-4"
//                   >
//                     {/* Author */}
//                     <View className="flex-row items-center">
//                       <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-900">
//                         <Text className="text-sm font-bold text-white">
//                           {getCommentAuthor(
//                             comment
//                           )
//                             .charAt(0)
//                             .toUpperCase()}
//                         </Text>
//                       </View>

//                       <View className="ml-3 flex-1">
//                         <Text className="font-bold text-gray-900">
//                           {getCommentAuthor(
//                             comment
//                           )}
//                         </Text>

//                         {commentDate && (
//                           <Text className="mt-0.5 text-xs text-gray-400">
//                             {formatDateTime(
//                               commentDate
//                             )}
//                           </Text>
//                         )}
//                       </View>
//                     </View>

//                     {/* Message */}
//                     <Text className="mt-3 text-sm leading-5 text-gray-700">
//                       {getCommentText(
//                         comment
//                       )}
//                     </Text>

//                     {/* Actions */}
//                     <View className="mt-4 flex-row items-center">
//                       <Pressable
//                         onPress={() =>
//                           setReplyingTo(
//                             isReplying
//                               ? null
//                               : commentId
//                           )
//                         }
//                         className="mr-3 flex-row items-center rounded-lg bg-gray-100 px-3 py-2"
//                       >
//                         <MessageCircle
//                           size={15}
//                           color="#374151"
//                         />

//                         <Text className="ml-1.5 text-xs font-semibold text-gray-700">
//                           Reply
//                         </Text>
//                       </Pressable>

//                       {selectedPlatform.toLowerCase() ===
//                         "facebook" && (
//                         <Pressable
//                           onPress={() =>
//                             handleDeleteComment(
//                               comment
//                             )
//                           }
//                           className="flex-row items-center rounded-lg bg-red-50 px-3 py-2"
//                         >
//                           <Trash2
//                             size={15}
//                             color="#dc2626"
//                           />

//                           <Text className="ml-1.5 text-xs font-semibold text-red-600">
//                             Delete
//                           </Text>
//                         </Pressable>
//                       )}
//                     </View>

//                     {/* Reply Box */}
//                     {isReplying && (
//                       <View className="mt-3">
//                         <TextInput
//                           value={replyText}
//                           onChangeText={
//                             setReplyText
//                           }
//                           placeholder="Write a reply..."
//                           placeholderTextColor="#9ca3af"
//                           multiline
//                           className="min-h-[90px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900"
//                           textAlignVertical="top"
//                         />

//                         <Pressable
//                           onPress={() =>
//                             handleReply(
//                               comment
//                             )
//                           }
//                           disabled={sending}
//                           className={`mt-2 flex-row items-center justify-center rounded-xl px-4 py-3 ${
//                             sending
//                               ? "bg-gray-400"
//                               : "bg-gray-900"
//                           }`}
//                         >
//                           {sending ? (
//                             <ActivityIndicator
//                               size="small"
//                               color="#ffffff"
//                             />
//                           ) : (
//                             <SendHorizontal
//                               size={16}
//                               color="#ffffff"
//                             />
//                           )}

//                           <Text className="ml-2 text-sm font-bold text-white">
//                             {sending
//                               ? "Sending..."
//                               : "Send Reply"}
//                           </Text>
//                         </Pressable>
//                       </View>
//                     )}
//                   </View>
//                 );
//               }
//             )
//           )}
//         </ScrollView>
//       </View>
//     </View>
//   );
// }