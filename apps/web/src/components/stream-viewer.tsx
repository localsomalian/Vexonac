"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  webSocketService,
  type StreamEvent,
  type WebRTCAnswer,
  type WebRTCICECandidate,
} from "@/lib/websocket";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Camera,
  Circle,
  Expand,
  ExternalLink,
  Gavel,
  Loader2,
  Minimize,
  MoreVertical,
  Pause,
  Play,
  Square,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { streamManager } from "@/lib/stream-manager";
import { useSession } from "@/hooks/use-session";
import Link from "next/link";

// Demo video URLs for multistream
const DEMO_VIDEOS = [
  "https://r2.vexonac.com/videos/1752783546242-641b8960-0c74-4f06-935e-6c4b59a507c9.webm",
  "https://r2.vexonac.com/videos/1752781729160-58757eda-9cf0-4c89-8971-8ecc7a5b06a7.webm",
  "https://r2.vexonac.com/videos/1752772935407-212a4a65-6069-4b28-83cf-2baa51dc6009.webm",
  "https://r2.vexonac.com/videos/1752769195013-fe5333a1-e114-4108-a5a6-2b01630f3b7b.webm",
  "https://r2.vexonac.com/videos/1752767481425-60154001-75ca-4a6a-93b3-bb69c5366ad8.webm",
  "https://r2.vexonac.com/videos/1752765102866-f29ca74b-2286-4a20-adfc-d276836c372e.webm",
  "https://r2.vexonac.com/videos/1752866521099-0f43c8ad-50b8-4029-8e04-64cb7ebc35e7.webm",
  "https://r2.vexonac.com/videos/1752865209811-1a676347-f79f-49b9-b278-ff6ed5d84ac7.webm",
];

interface StreamSession {
  streamId: string;
  playerId: string;
  playerName: string;
  serverName: string;
  serverId: string;
  startTime: number;
  duration: number;
}

interface WebRTCConnection {
  pc: RTCPeerConnection;
  streamId: string;
  playerId: string;
  serverId: string;
}

interface StreamViewerProps {
  serverId: string;
  playerId: string;
  playerName?: string;
  playerLicense?: string;
  onStreamStateChange?: (isStreaming: boolean) => void;
  className?: string;
}

interface PlayerActionModal {
  type: "kick" | "ban" | null;
  isOpen: boolean;
}

interface ActionForm {
  reason: string;
  duration: number;
  banType: "permanent" | "temporary";
}

const StreamViewerComponent = function StreamViewer({
  serverId,
  playerId,
  playerName,
  playerLicense,
  onStreamStateChange,
  className = "",
}: StreamViewerProps) {
  const [connections, setConnections] = useState<Map<string, WebRTCConnection>>(
    new Map()
  );
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [streamRequested, setStreamRequested] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [latestScreenshotUrl, setLatestScreenshotUrl] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<PlayerActionModal>({
    type: null,
    isOpen: false,
  });
  const [actionForm, setActionForm] = useState<ActionForm>({
    reason: "",
    duration: 24 * 60 * 60,
    banType: "permanent",
  });

  // Demo mode detection
  const isDemoMode = serverId === "demo";
  const demoVideoUrl = isDemoMode ? DEMO_VIDEOS[parseInt(playerId) % DEMO_VIDEOS.length] : null;

  // Track streams this component is managing
  const managedStreamsRef = useRef<Set<string>>(new Set());

  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamRequestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queuedICECandidatesRef = useRef<Map<string, WebRTCICECandidate[]>>(
    new Map()
  );
  const pendingICECandidatesRef = useRef<Map<string, RTCIceCandidate[]>>(
    new Map()
  );
  const iceBatchTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const screenshotPollActiveRef = useRef(false);
  const screenshotPollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const screenshotFallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // tRPC queries and mutations - filter sessions by serverId
  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    ...trpc.webrtc.getSessions.queryOptions({ serverId }),
    refetchInterval: 2000, // Poll for active sessions
    enabled: streamRequested,
  });

  const sendOfferMutation = useMutation(
    trpc.webrtc.sendOffer.mutationOptions()
  );
  const sendICECandidateMutation = useMutation(
    trpc.webrtc.sendICECandidate.mutationOptions()
  );
  const requestStreamMutation = useMutation(
    trpc.webrtc.requestStream.mutationOptions()
  );
  const generateTurnCredentialsMutation = useMutation(
    trpc.webrtc.generateTurnCredentials.mutationOptions()
  );
  const screenshotEventMutation = useMutation(
    trpc.fivem.event.mutationOptions()
  );

  // Player action mutations
  const kickPlayerMutation = useMutation(
    trpc.fivem.event.mutationOptions({
      onSuccess: () => {
        toast.success(`Successfully kicked ${playerName || "player"}`);
        setActionModal({ type: null, isOpen: false });
        setActionForm({
          reason: "",
          duration: 24 * 60 * 60,
          banType: "permanent",
        });
        queryClient.invalidateQueries({
          queryKey: [["servers", "getCurrentPlayers"]],
        });
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to kick player");
      },
    })
  );

  const banPlayerEventMutation = useMutation(
    trpc.fivem.event.mutationOptions({
      onSuccess: () => {
        toast.success(`Successfully banned ${playerName || "player"}`);
        setActionModal({ type: null, isOpen: false });
        setActionForm({
          reason: "",
          duration: 24 * 60 * 60,
          banType: "permanent",
        });
        queryClient.invalidateQueries({
          queryKey: [["servers", "getCurrentPlayers"]],
        });
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to ban player");
      },
    })
  );

  const activeSessions: StreamSession[] =
    sessionsData && "success" in sessionsData && sessionsData.success && "sessions" in sessionsData
      ? (sessionsData.sessions as StreamSession[])
      : [];

  const stopScreenshotPoll = useCallback(() => {
    screenshotPollActiveRef.current = false;
    if (screenshotPollTimerRef.current) {
      clearTimeout(screenshotPollTimerRef.current);
      screenshotPollTimerRef.current = null;
    }
    if (screenshotFallbackTimerRef.current) {
      clearTimeout(screenshotFallbackTimerRef.current);
      screenshotFallbackTimerRef.current = null;
    }
    setScreenshotMode(false);
    setLatestScreenshotUrl(null);
  }, []);

  const startScreenshotPoll = useCallback(() => {
    if (isDemoMode || screenshotPollActiveRef.current) return;
    screenshotPollActiveRef.current = true;
    setScreenshotMode(true);
    setIsConnecting(false);

    const doPoll = async () => {
      if (!screenshotPollActiveRef.current) return;
      try {
        const result = await screenshotEventMutation.mutateAsync({
          serverId,
          eventName: "screenshotPlayer",
          data: { playerId },
        });
        if (screenshotPollActiveRef.current && (result as any).screenshotUrl) {
          setLatestScreenshotUrl((result as any).screenshotUrl);
          setIsStreaming(true);
          setIsConnecting(false);
          onStreamStateChange?.(true);
        }
      } catch (_) {}
      if (screenshotPollActiveRef.current) {
        screenshotPollTimerRef.current = setTimeout(doPoll, 3500);
      }
    };

    doPoll();
  }, [isDemoMode, serverId, playerId, onStreamStateChange]);

  // Subscribe to WebRTC events once on mount - optimized with reference counting
  useEffect(() => {
    // Reference counting ensures only one global subscription to WebRTC events
    webSocketService.subscribeToWebRTC();
    return () => {
      webSocketService.unsubscribeFromWebRTC();
    };
  }, []);

  // WebRTC event handlers - only handle events for our specific streams
  useEffect(() => {
    const handleWebRTCAnswer = (data: WebRTCAnswer) => {
      // Only handle events for streams that this component is managing
      if (!managedStreamsRef.current.has(data.streamId)) {
        return; // Skip events for streams not managed by this component
      }

      setConnections((currentConnections) => {
        const connection = currentConnections.get(data.streamId);
        if (connection) {
          if (connection.pc.remoteDescription === null) {
            connection.pc
              .setRemoteDescription(data.answer)
              .then(() => {
                // Process any queued ICE candidates
                const queuedCandidates =
                  queuedICECandidatesRef.current.get(data.streamId) || [];
                if (queuedCandidates.length > 0) {
                  queuedCandidates.forEach((candidate) => {
                    connection.pc
                      .addIceCandidate(candidate.candidate)
                      .catch((error) => {
                        console.error(
                          "Failed to add queued ICE candidate:",
                          error
                        );
                      });
                  });
                  // Clear the queue
                  queuedICECandidatesRef.current.delete(data.streamId);
                }
              })
              .catch((error) => {
                console.error("Failed to set remote description:", error);
              });
          }
        }
        return currentConnections;
      });
    };

    const handleICECandidate = (data: WebRTCICECandidate) => {
      // Only handle events for streams that this component is managing
      if (!managedStreamsRef.current.has(data.streamId)) {
        return; // Skip events for streams not managed by this component
      }

      setConnections((currentConnections) => {
        const connection = currentConnections.get(data.streamId);
        if (connection) {
          if (connection.pc.remoteDescription) {
            connection.pc.addIceCandidate(data.candidate).catch((error) => {
              console.error("Failed to add remote ICE candidate:", error);
            });
          } else {
            // Queue the ICE candidate for later processing
            const currentQueue =
              queuedICECandidatesRef.current.get(data.streamId) || [];
            currentQueue.push(data);
            queuedICECandidatesRef.current.set(data.streamId, currentQueue);
          }
        }
        return currentConnections;
      });
    };

    const handleStreamStarted = (data: StreamEvent) => {
      // Only refetch sessions if this is for our player
      if (data.playerId === playerId && data.serverId === serverId) {
        refetchSessions();
      }
    };

    const handleStreamStopped = (data: StreamEvent) => {
      // Only refetch sessions if this is for our player
      if (data.playerId === playerId && data.serverId === serverId) {
        refetchSessions();
      }

      // Only handle stream stop for streams managed by this component
      if (!managedStreamsRef.current.has(data.streamId)) {
        return; // Skip events for streams not managed by this component
      }

      setConnections((currentConnections) => {
        const connection = currentConnections.get(data.streamId);
        if (connection) {
          connection.pc.close();
          const newMap = new Map(currentConnections);
          newMap.delete(data.streamId);

          // Remove from managed streams and global manager
          managedStreamsRef.current.delete(data.streamId);
          streamManager.removeStream(data.streamId);

          setSelectedStream((currentSelected) => {
            if (currentSelected === data.streamId) {
              setIsPlaying(false);
              setIsStreaming(false);
              setIsConnecting(false);
              onStreamStateChange?.(false);
              if (videoRef.current) {
                videoRef.current.srcObject = null;
              }
              return null;
            }
            return currentSelected;
          });

          return newMap;
        }
        return currentConnections;
      });
    };

    // Register global event handlers (each component registers but filters by its own streams)
    webSocketService.on("webrtcAnswer", handleWebRTCAnswer);
    webSocketService.on("webrtcICECandidate", handleICECandidate);
    webSocketService.on("streamStarted", handleStreamStarted);
    webSocketService.on("streamStopped", handleStreamStopped);

    return () => {
      webSocketService.off("webrtcAnswer", handleWebRTCAnswer);
      webSocketService.off("webrtcICECandidate", handleICECandidate);
      webSocketService.off("streamStarted", handleStreamStarted);
      webSocketService.off("streamStopped", handleStreamStopped);
    };
  }, [refetchSessions, onStreamStateChange, playerId, serverId]);

  // Start WebRTC connection - exact same function as stream test page
  const startStream = async (
    streamId: string,
    playerId: string,
    serverId: string
  ) => {
    try {
      // Prevent multiple connections to the same stream
      if (connections.has(streamId)) {
        return;
      }

      // Prevent multiple simultaneous connection attempts
      if (isConnecting || selectedStream) {
        return;
      }

      // Check concurrent stream limit
      if (!streamManager.canCreateStream()) {
        toast.error("Stream Limit Reached", {
          description: `Maximum ${streamManager.getMaxStreams()} concurrent streams allowed (${streamManager.getStreamCount()} active)`,
        });
        return;
      }

      // FiveM NUI cannot captureStream() the game canvas — skip WebRTC entirely
      // and go straight to screenshot polling.
      startScreenshotPoll();
      return;

      // ðŸŽ¯ BANDWIDTH OPTIMIZATION: STUN-FIRST with TURN FALLBACK
      // Simple approach: Include both STUN and TURN, but STUN will be preferred naturally
      // Result: 100% success rate with maximum bandwidth savings when possible

      const stunServers: RTCIceServer[] = [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun.cloudflare.com:3478",
            "stun:openrelay.metered.ca:80",
          ],
        },
      ];

      // Get TURN credentials for 100% success rate
      let iceServers = [...stunServers]; // Start with STUN only

      try {
        const turnResult = await generateTurnCredentialsMutation.mutateAsync({
          serverId,
          playerId,
        });

        if (turnResult.success && 'iceServers' in turnResult && turnResult.iceServers) {
          const turnServers = Array.isArray(turnResult.iceServers)
            ? turnResult.iceServers
            : [turnResult.iceServers];

          // Add TURN servers AFTER STUN (WebRTC will prefer STUN when possible)
          iceServers = [...stunServers, ...turnServers];
        } else {
          console.warn("TURN unavailable - STUN-only mode");
        }
      } catch (error) {
        console.warn("TURN failed - STUN-only mode:", error);
      }

      // Create optimized peer connection
      const pc = new RTCPeerConnection({
        iceServers,
        iceTransportPolicy: "all", // Allow both, prefer STUN naturally
        iceCandidatePoolSize: 10,
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      });

      // Add video transceiver to request video from remote peer with bandwidth-optimized settings
      const videoTransceiver = pc.addTransceiver("video", {
        direction: "recvonly",
        streams: [],
      });

      const codecs = RTCRtpReceiver.getCapabilities("video")?.codecs || [];

      // H.264 High profile — best quality
      const h264HighCodecs = codecs.filter(
        (codec) =>
          codec.mimeType.toLowerCase() === "video/h264" &&
          !codec.sdpFmtpLine?.includes("profile-level-id=42e01f")
      );

      // VP9 — high quality with good compression
      const vp9Codecs = codecs.filter(
        (codec) => codec.mimeType.toLowerCase() === "video/vp9"
      );

      // H.264 Baseline — widest compatibility fallback
      const h264BaselineCodecs = codecs.filter(
        (codec) =>
          codec.mimeType.toLowerCase() === "video/h264" &&
          codec.sdpFmtpLine?.includes("profile-level-id=42e01f")
      );

      // VP8 — last resort fallback
      const vp8Codecs = codecs.filter(
        (codec) => codec.mimeType.toLowerCase() === "video/vp8"
      );

      // Order by quality: High H.264 > VP9 > Baseline H.264 > VP8
      const preferredCodecs = [
        ...h264HighCodecs.slice(0, 1),
        ...vp9Codecs.slice(0, 1),
        ...h264BaselineCodecs.slice(0, 1),
        ...vp8Codecs.slice(0, 1),
      ];

      if (preferredCodecs.length > 0) {
        videoTransceiver.setCodecPreferences(preferredCodecs);
      }

      // Add minimal data channel
      pc.createDataChannel("stream", {
        ordered: false,
        maxRetransmits: 0,
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        remoteStreamRef.current = remoteStream || null;

        if (videoRef.current) {
          // Set up event listeners before setting srcObject
          const video = videoRef.current;

          const handleCanPlay = () => {
            // Try to play if video exists and has a source
            if (video.srcObject) {
              video
                .play()
                .then(() => {
                  setIsPlaying(true);
                  setIsStreaming(true);
                  setIsConnecting(false);

                  // Clear the connecting timeout since video is now playing
                  if (connectingTimeoutRef.current) {
                    clearTimeout(connectingTimeoutRef.current);
                    connectingTimeoutRef.current = null;
                  }

                  // Clear stream request timeout since we're now connected
                  if (streamRequestTimeoutRef.current) {
                    clearTimeout(streamRequestTimeoutRef.current);
                    streamRequestTimeoutRef.current = null;
                  }

                  // Clear screenshot fallback timer since WebRTC connected
                  if (screenshotFallbackTimerRef.current) {
                    clearTimeout(screenshotFallbackTimerRef.current);
                    screenshotFallbackTimerRef.current = null;
                  }

                  onStreamStateChange?.(true);
                })
                .catch((error) => {
                  console.error("Failed to play video:", error);
                  // Handle AbortError gracefully (happens when new stream interrupts play)
                  if (error.name !== "AbortError") {
                    setTimeout(() => {
                      if (video.srcObject && video.paused) {
                        video.play().catch(() => {
                          setIsConnecting(false);
                          setIsStreaming(false);
                        });
                      }
                    }, 500);
                  }
                });
            } else {
              setIsConnecting(false);
            }
          };

          const handleLoadStart = () => {
            setIsConnecting(true);

            // Progressive fallback attempts with multiple strategies
            let fallbackAttempts = 0;
            const maxAttempts = 3;

            const tryFallbackPlay = () => {
              fallbackAttempts++;
              const delay = fallbackAttempts * 3000; // 3s, 6s, 9s

              setTimeout(() => {
                if (
                  (isConnecting || selectedStream) &&
                  video.srcObject &&
                  !isStreaming
                ) {
                  video
                    .play()
                    .then(() => {
                      setIsPlaying(true);
                      setIsStreaming(true);
                      setIsConnecting(false);
                      if (connectingTimeoutRef.current) {
                        clearTimeout(connectingTimeoutRef.current);
                        connectingTimeoutRef.current = null;
                      }
                      if (streamRequestTimeoutRef.current) {
                        clearTimeout(streamRequestTimeoutRef.current);
                        streamRequestTimeoutRef.current = null;
                      }
                      if (screenshotFallbackTimerRef.current) {
                        clearTimeout(screenshotFallbackTimerRef.current);
                        screenshotFallbackTimerRef.current = null;
                      }
                      onStreamStateChange?.(true);
                    })
                    .catch((error) => {
                      console.error(
                        `Fallback play attempt ${fallbackAttempts} failed:`,
                        error
                      );
                      if (fallbackAttempts < maxAttempts) {
                        tryFallbackPlay();
                      } else {
                        console.error("All fallback attempts failed");
                        setIsConnecting(false);
                      }
                    });
                }
              }, delay);
            };

            // Start first fallback attempt after 5 seconds
            setTimeout(tryFallbackPlay, 5000);
          };

          video.addEventListener("canplay", handleCanPlay, { once: true });
          video.addEventListener("loadstart", handleLoadStart, { once: true });

          video.addEventListener("error", (e) => {
            console.error("Video error event:", e);
          });

          // Set the stream source
          video.srcObject = remoteStream || null;
        }
      };

      // ðŸŽ¯ BANDWIDTH OPTIMIZATION: Smart ICE candidate filtering  
      const shouldSendCandidate = (candidate: RTCIceCandidate): boolean => {
        const candidateString = candidate.candidate || "";

        // Always skip TCP candidates (UDP is more efficient for real-time media)
        if (candidateString.includes("tcp")) {
          return false;
        }

        // PRIORITY 1: Host candidates (Direct P2P, FREE, fastest)
        if (candidateString.includes("typ host")) {
          const existingHost = pendingICECandidatesRef.current
            .get(streamId)
            ?.find((c) => c.candidate?.includes("typ host"));
          if (!existingHost) {
            return true;
          }
          return false;
        }

        // PRIORITY 2: STUN reflexive candidates (NAT traversal, FREE)
        if (candidateString.includes("typ srflx")) {
          return true;
        }

        // PRIORITY 3: TURN relay candidates (Expensive fallback, but needed for 100% success)
        if (candidateString.includes("typ relay")) {
          return true; // Allow TURN for 100% success rate
        }

        // Skip peer reflexive and unknown types
        return false;
      };

      // Batch ICE candidates to reduce network traffic
      const batchSendICECandidates = (streamId: string) => {
        const pendingCandidates =
          pendingICECandidatesRef.current.get(streamId) || [];
        if (pendingCandidates.length === 0) return;

        // Send all pending candidates
        pendingCandidates.forEach(async (candidate) => {
          try {
            await sendICECandidateMutation.mutateAsync({
              serverId,
              playerId,
              streamId,
              candidate: {
                candidate: candidate.candidate,
                sdpMLineIndex: candidate.sdpMLineIndex,
                sdpMid: candidate.sdpMid,
              },
            });
          } catch (error) {
            console.error("Failed to send batched ICE candidate:", error);
          }
        });

        // Clear the batch
        pendingICECandidatesRef.current.delete(streamId);
        iceBatchTimeoutRef.current.delete(streamId);
      };

      // Handle ICE candidates with filtering and batching
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          // Filter candidate
          if (!shouldSendCandidate(event.candidate)) {
            return;
          }

          // Add to pending batch
          const currentBatch =
            pendingICECandidatesRef.current.get(streamId) || [];
          currentBatch.push(event.candidate);
          pendingICECandidatesRef.current.set(streamId, currentBatch);

          // Clear existing timeout
          const existingTimeout = iceBatchTimeoutRef.current.get(streamId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Set new batch timeout (send after 500ms of no new candidates)
          const timeout = setTimeout(() => {
            batchSendICECandidates(streamId);
          }, 500);
          iceBatchTimeoutRef.current.set(streamId, timeout);
        } else {
          // Send any remaining candidates immediately
          const timeout = iceBatchTimeoutRef.current.get(streamId);
          if (timeout) {
            clearTimeout(timeout);
            batchSendICECandidates(streamId);
          }
        }
      };

      // ðŸŽ¯ BANDWIDTH MONITORING: Connection state with cost analysis  
      pc.onconnectionstatechange = async () => {
        if (pc.connectionState === "connected") {
          // Clear the connecting timeout since we're now connected
          if (connectingTimeoutRef.current) {
            clearTimeout(connectingTimeoutRef.current);
            connectingTimeoutRef.current = null;
          }
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          console.error("âŒ [WEBRTC DEBUG] Connection failed/disconnected:", {
            connectionState: pc.connectionState,
            iceConnectionState: pc.iceConnectionState,
            iceGatheringState: pc.iceGatheringState
          });

          // Clear the connecting timeout
          if (connectingTimeoutRef.current) {
            clearTimeout(connectingTimeoutRef.current);
            connectingTimeoutRef.current = null;
          }

          setIsConnecting(false);
          setIsStreaming(false);
          onStreamStateChange?.(false);

          // Clean up this specific connection
          setConnections((prev) => {
            const newMap = new Map(prev);
            newMap.delete(streamId);
            return newMap;
          });

          // Remove from global manager
          streamManager.removeStream(streamId);

          // Reset selected stream if it matches
          setSelectedStream((current) =>
            current === streamId ? null : current
          );
        }
      };

      // ICE connection state monitoring (more detailed than connection state)
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          console.warn("ICE connection failed, attempting restart");
          // Try ICE restart
          pc.restartIce();
        } else if (pc.iceConnectionState === "connected") {
          //console.log("✅ [ICE DEBUG] ICE connection established");
        } else if (pc.iceConnectionState === "disconnected") {
          //console.warn("âš ï¸ [ICE DEBUG] ICE connection disconnected");
        }
      };

      // ICE gathering state monitoring for STUN issues
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === "complete") {
          //console.log("✅ [ICE DEBUG] ICE gathering completed");
        }
      };

      // Register stream with global manager
      if (!streamManager.addStream(streamId)) {
        throw new Error("Failed to register stream with global manager");
      }

      // Store connection and track this stream as managed by this component
      const connection: WebRTCConnection = { pc, streamId, playerId, serverId };
      setConnections((prev) => new Map(prev).set(streamId, connection));
      managedStreamsRef.current.add(streamId);

      // Create and send optimized offer
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false, // Explicitly disable audio
        iceRestart: false,
      });

      await pc.setLocalDescription(offer);

      await sendOfferMutation.mutateAsync({
        serverId,
        playerId,
        streamId,
        offer: {
          type: "offer" as const,
          sdp: offer.sdp!,
        },
      });

      setSelectedStream(streamId);
    } catch (error) {
      console.error("Failed to start stream:", error);

      // Remove from global manager on error
      streamManager.removeStream(streamId);

      toast.error("Stream Error", {
        description:
          error instanceof Error ? error.message : "Failed to start stream",
      });
      setIsConnecting(false);
      setIsStreaming(false);
      onStreamStateChange?.(false);
    }
  };

  // Initial stream request
  const requestStream = async () => {
    if (!playerId.trim() || !serverId.trim()) {
      toast.error("Invalid Input", {
        description: "Please provide both server ID and player ID",
      });
      return;
    }

    // Handle demo mode
    if (isDemoMode) {
      setStreamRequested(true);
      setIsStreaming(true);
      setIsPlaying(true);
      onStreamStateChange?.(true);
      return;
    }

    // FiveM NUI cannot captureStream() — skip WebRTC session flow entirely
    // and go straight to screenshot polling.
    startScreenshotPoll();
  };

  // Auto-start when session becomes available (with debounce to prevent race conditions)
  useEffect(() => {
    if (
      streamRequested &&
      activeSessions.length > 0 &&
      !selectedStream &&
      !isConnecting &&
      !isStreaming
    ) {
      // Add a small delay to prevent multiple components from starting simultaneously
      const timeout = setTimeout(() => {
        // Double-check state after timeout to ensure we still should start
        if (!selectedStream && !isConnecting && !isStreaming) {
          // Find all our sessions and get the most recent one
          const ourSessions = activeSessions.filter(
            (session) =>
              session.playerId === playerId && session.serverId === serverId
          );

          if (ourSessions.length > 0) {
            // Sort by streamId (which contains timestamp) and get the most recent
            const mostRecentSession = ourSessions.sort((a, b) => {
              const aTime = parseInt(a.streamId.split("_").pop() || "0");
              const bTime = parseInt(b.streamId.split("_").pop() || "0");
              return bTime - aTime; // Most recent first
            })[0];

            if (mostRecentSession) {
              startStream(
                mostRecentSession.streamId,
                mostRecentSession.playerId,
                mostRecentSession.serverId
              );
            }
          }
        }
      }, Math.random() * 500); // Random delay 0-500ms to prevent simultaneous starts

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [
    activeSessions,
    streamRequested,
    selectedStream,
    isConnecting,
    isStreaming,
    playerId,
    serverId,
  ]);

  // Complete cleanup function
  const cleanup = () => {
    // Stop screenshot polling
    screenshotPollActiveRef.current = false;
    if (screenshotPollTimerRef.current) {
      clearTimeout(screenshotPollTimerRef.current);
      screenshotPollTimerRef.current = null;
    }
    if (screenshotFallbackTimerRef.current) {
      clearTimeout(screenshotFallbackTimerRef.current);
      screenshotFallbackTimerRef.current = null;
    }

    // Close all WebRTC connections
    connections.forEach((connection) => {
      if (connection.pc.connectionState !== "closed") {
        connection.pc.close();
      }
    });
    setConnections(new Map());

    // Clear managed streams and remove from global manager
    managedStreamsRef.current.forEach(streamId => {
      streamManager.removeStream(streamId);
    });
    managedStreamsRef.current.clear();

    // Reset video properly
    if (videoRef.current) {
      const video = videoRef.current;

      // Pause video first to stop any pending play requests
      video.pause();

      // Clear the source
      video.srcObject = null;
      video.load(); // Reset the video element
    }

    // Stop recording
    if (isRecording) {
      stopRecording();
    }

    // Clear connecting timeout
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current);
      connectingTimeoutRef.current = null;
    }

    // Clear stream request timeout
    if (streamRequestTimeoutRef.current) {
      clearTimeout(streamRequestTimeoutRef.current);
      streamRequestTimeoutRef.current = null;
    }

    // Clear queued ICE candidates for this component only
    queuedICECandidatesRef.current.clear();

    // Clear pending ICE candidates and timeouts for this component only
    pendingICECandidatesRef.current.clear();
    iceBatchTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
    iceBatchTimeoutRef.current.clear();

    // Reset all state
    setSelectedStream(null);
    setIsStreaming(false);
    setIsPlaying(false);
    setIsConnecting(false);
    setStreamRequested(false);
    setIsFullscreen(false);
    setScreenshotMode(false);
    setLatestScreenshotUrl(null);

    // Clear remote stream ref
    remoteStreamRef.current = null;

    // Notify parent that streaming stopped
    onStreamStateChange?.(false);
  };

  // Request stream on mount
  useEffect(() => {
    requestStream();

    // Cleanup on unmount
    return cleanup;
  }, []);

  // Screenshot functionality
  const takeScreenshot = () => {
    if (!videoRef.current || !isStreaming) {
      toast.error("No stream available for screenshot");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      toast.error("Failed to create screenshot");
      return;
    }

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `screenshot-${playerId}-${playerName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Screenshot saved to downloads");
      }
    }, "image/png");
  };

  // Recording functionality
  const startRecording = () => {
    if (!remoteStreamRef.current || !isStreaming) {
      toast.error("No stream available for recording");
      return;
    }

    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(remoteStreamRef.current, {
        mimeType: "video/webm;codecs=vp9",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `recording-${playerId}-${playerName}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Recording saved to downloads");
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setRecordingTime(0);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
      }
      if (streamRequestTimeoutRef.current) {
        clearTimeout(streamRequestTimeoutRef.current);
      }
      if (screenshotPollTimerRef.current) {
        clearTimeout(screenshotPollTimerRef.current);
      }
      if (screenshotFallbackTimerRef.current) {
        clearTimeout(screenshotFallbackTimerRef.current);
      }
      screenshotPollActiveRef.current = false;
      // Clear ICE batch timeouts
      iceBatchTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      iceBatchTimeoutRef.current.clear();
    };
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = async () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    try {
      if (!isFullscreen) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle action execution
  const executeAction = () => {
    switch (actionModal.type) {
      case "kick":
        kickPlayerMutation.mutate({
          serverId,
          eventName: "kickPlayer",
          data: {
            playerId: playerId,
            reason: actionForm.reason || "No reason provided",
            by: session?.user?.name || "Unknown Admin",
          },
        });
        break;
      case "ban":
        banPlayerEventMutation.mutate({
          serverId,
          eventName: "banPlayer",
          data: {
            playerId: playerId,
            reason: actionForm.reason,
            by: session?.user?.name || "Unknown Admin",
            duration:
              actionForm.banType === "temporary"
                ? actionForm.duration
                : undefined,
          },
        });
        break;
    }
  };

  // Determine status message
  const getStatusMessage = () => {
    const streamCount = streamManager.getStreamCount();
    const maxStreams = streamManager.getMaxStreams();

    if (!streamRequested || requestStreamMutation.isPending) {
      return `Requesting stream... (${streamCount}/${maxStreams} active)`;
    }
    if (streamRequested && !selectedStream && !isConnecting) {
      return `Waiting for stream to start... (${streamCount}/${maxStreams} active)`;
    }
    if (isConnecting) {
      return `Connecting... (${streamCount}/${maxStreams} active)`;
    }
    return `Stream offline (${streamCount}/${maxStreams} active)`;
  };

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden w-full aspect-video ${className}`}
    >
      <video
        ref={videoRef}
        src={isDemoMode && isStreaming ? demoVideoUrl || undefined : undefined}
        autoPlay
        playsInline
        muted={isMuted}
        loop={isDemoMode}
        className={`w-full h-full object-contain ${screenshotMode && latestScreenshotUrl ? "hidden" : ""}`}
        onLoadedMetadata={() => setIsPlaying(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onAbort={() => {
          setIsPlaying(false);
        }}
        onError={(e) => {
          console.error("Video error:", e);
          setIsPlaying(false);
        }}
        onCanPlay={(e) => {
          if (isDemoMode && isStreaming) {
            e.currentTarget.play().catch(() => {});
          }
        }}
      />

      {/* Screenshot mode display */}
      {screenshotMode && latestScreenshotUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={latestScreenshotUrl}
          alt="Player screenshot"
          className="w-full h-full object-contain absolute inset-0"
        />
      )}



      {/* Action buttons overlay - top right */}
      <div className="absolute top-4 right-4 flex gap-2">
        {/* Screenshot mode toggle */}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => screenshotMode ? stopScreenshotPoll() : startScreenshotPoll()}
          title={screenshotMode ? "Stop screenshot mode" : "Switch to screenshot mode"}
          className={`backdrop-blur-sm ${screenshotMode ? "bg-yellow-500/80 hover:bg-yellow-600/80" : "bg-black/50 hover:bg-black/70"}`}
        >
          <Camera className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={takeScreenshot}
          disabled={!isStreaming || screenshotMode}
          className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
        >
          <Camera className="h-4 w-4" />
        </Button>

        {!isRecording ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={startRecording}
            disabled={!isStreaming}
            className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
          >
            <Circle className="h-4 w-4 text-red-500" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={stopRecording}
            className="bg-red-500/80 backdrop-blur-sm hover:bg-red-600/80"
          >
            <Square className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Player Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setActionModal({ type: "kick", isOpen: true })}
            >
              <Ban className="h-4 w-4 mr-2" />
              Kick Player
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setActionModal({ type: "ban", isOpen: true })}
            >
              <Gavel className="h-4 w-4 mr-2" />
              Ban Player
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild disabled={!playerLicense}>
              <Link
                href={playerLicense ? `/dashboard/server/${serverId}/lookup?license=${playerLicense}` : "#"}
                target="_blank"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Lookup
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="secondary"
          onClick={toggleFullscreen}
          className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Expand className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/80 backdrop-blur-sm rounded-lg px-3 py-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-sm font-mono">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Minimal controls - bottom right */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={togglePlayPause}
          className="text-white hover:bg-white/20 bg-black/50 backdrop-blur-sm"
          disabled={!isStreaming}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        {isStreaming && !screenshotMode && (
          <div className="flex items-center gap-1 text-green-400 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs">LIVE</span>
          </div>
        )}
        {screenshotMode && (
          <div className="flex items-center gap-1 text-yellow-400 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-xs">SNAP</span>
          </div>
        )}
      </div>

      {/* Loading/Connection State */}
      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-white mb-2 mx-auto" />
            <p className="text-white text-sm">
              {screenshotMode ? "Capturing screenshot..." : getStatusMessage()}
            </p>
            {screenshotMode && (
              <p className="text-white/60 text-xs mt-1">Waiting for player screenshot...</p>
            )}
          </div>
        </div>
      )}

      {/* Kick Player Modal */}
      <Dialog
        open={actionModal.isOpen && actionModal.type === "kick"}
        onOpenChange={(open) =>
          setActionModal({ type: null, isOpen: open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Kick Player - {playerName || `Player ${playerId}`}
            </DialogTitle>
            <DialogDescription>
              This will kick the player from the server. They can rejoin
              immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="kickReason">Reason (Optional)</Label>
              <Textarea
                id="kickReason"
                placeholder="Enter reason for kicking..."
                value={actionForm.reason}
                onChange={(e) =>
                  setActionForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModal({ type: null, isOpen: false })}
              disabled={kickPlayerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeAction}
              disabled={kickPlayerMutation.isPending}
            >
              {kickPlayerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kicking...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Kick Player
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Player Modal */}
      <Dialog
        open={actionModal.isOpen && actionModal.type === "ban"}
        onOpenChange={(open) =>
          setActionModal({ type: null, isOpen: open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Ban Player - {playerName || `Player ${playerId}`}
            </DialogTitle>
            <DialogDescription>
              This will ban the player from the server. This action can be
              reversed from the bans page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (Required)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for banning..."
                value={actionForm.reason}
                onChange={(e) =>
                  setActionForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="permanentBan"
                checked={actionForm.banType === "permanent"}
                onCheckedChange={(checked) =>
                  setActionForm((prev) => ({
                    ...prev,
                    banType: checked ? "permanent" : "temporary",
                  }))
                }
              />
              <Label htmlFor="permanentBan">Permanent Ban</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {actionForm.banType === "permanent"
                ? "This ban will remain active until manually removed."
                : "This ban will automatically expire after the specified duration."}
            </p>

            {actionForm.banType === "temporary" && (
              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="8760"
                  value={actionForm.duration / (60 * 60)}
                  onChange={(e) =>
                    setActionForm((prev) => ({
                      ...prev,
                      duration:
                        parseInt(e.target.value) * 60 * 60 || 24 * 60 * 60,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModal({ type: null, isOpen: false })}
              disabled={banPlayerEventMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!actionForm.reason.trim()) {
                  toast.error("Please provide a reason for the ban");
                  return;
                }
                executeAction();
              }}
              disabled={
                banPlayerEventMutation.isPending || !actionForm.reason.trim()
              }
            >
              {banPlayerEventMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Banning...
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4 mr-2" />
                  Ban Player
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const StreamViewer = memo(StreamViewerComponent);

