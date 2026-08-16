"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { AttachAddon } from "@xterm/addon-attach";
import { webSocketService } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Terminal as TerminalIcon, Send, Trash2, Search, Download, X, ChevronUp, ChevronDown, ChevronDown as ChevronDownIcon, Shield, Zap, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Import xterm CSS
import "xterm/css/xterm.css";
import "@/styles/console.css";
import { useSession } from "@/hooks/use-session";
// Demo data for console when in demo mode
const DEMO_SERVER_ID = "demo";

const isDemoServer = (serverId: string): boolean => {
	return serverId === DEMO_SERVER_ID;
};

const getDemoConsoleOutput = () => {
	const currentTime = new Date();
	const messages = [
		"^2[INFO] ^7Server started successfully",
		"^3[WARN] ^7Resource 'VexonAC' loaded",
		"^2[INFO] ^7Player ^5GamerGirl2024^7 joined the server",
		"^2[INFO] ^7Player ^5xXDarkLord123Xx^7 joined the server",
		"^6[CHAT] ^5GamerGirl2024^7: Hey everyone!",
		"^6[CHAT] ^5xXDarkLord123Xx^7: What's up?",
		"^3[WARN] ^7High player count detected: 256/300",
		"^2[INFO] ^7Player ^5NoobSlayer69^7 joined the server",
		"^1[ERROR] ^7Player ^5ProHacker_420^7 disconnected (timeout)",
		"^5[ANTICHEAT] ^7VexonAC: Monitoring 256 players",
		"^6[CHAT] ^5NoobSlayer69^7: Anyone want to race?",
		"^2[INFO] ^7Player ^5SilentAssassin^7 joined the server",
		"^3[WARN] ^7Resource usage: CPU 45%, Memory 2.1GB",
		"^6[CHAT] ^5GamerGirl2024^7: Sure! Meet at the airport",
		"^5[ANTICHEAT] ^7Detection: Suspicious activity from player ID 142",
		"^1[BAN] ^7Player ^5CheatMaster2024^7 banned for AimBot Detected",
		"^2[INFO] ^7Player ^5RedBullAddict^7 joined the server",
		"^6[CHAT] ^5xXDarkLord123Xx^7: Nice car bro",
		"^3[WARN] ^7Network lag detected: 150ms average",
		"^2[INFO] ^7Auto-save completed successfully",
		"^6[CHAT] ^5TwitchStreamer^7: Thanks for watching my stream!",
		"^5[ANTICHEAT] ^7VexonAC: Threat assessment complete",
		"^2[INFO] ^7Player ^5YTInfluencer^7 joined the server",
		"^6[CHAT] ^5DiscordMod^7: Remember to follow the rules",
		"^3[WARN] ^7Database connection latency: 25ms",
		"^1[KICK] ^7Player ^5ToxicPlayer123^7 kicked for rule violation",
		"^2[INFO] ^7Player ^5MinecraftSteve^7 joined the server",
		"^6[CHAT] ^5Fortnite_Kid^7: This server is awesome!",
		"^5[ANTICHEAT] ^7Vehicle spawn check: All clear",
		"^2[INFO] ^7Server uptime: 4h 32m 15s"
	];

	return messages.map((message, index) => ({
		id: `demo-log-${index}`,
		serverId: DEMO_SERVER_ID,
		output: message,
		timestamp: currentTime.getTime() - (messages.length - index) * 5000, // 5 seconds apart
	}));
};

const getDemoCommandResult = (command: string) => {
	const responses: Record<string, string> = {
		"help": "^2Available commands: ^7players, kick, ban, unban, restart, say, weather, time",
		"players": "^2Online players: ^7256/300",
		"status": "^2Server Status: ^7Online | Uptime: 4h 32m | Players: 256/300",
		"restart": "^3[WARN] ^7Server restart scheduled in 5 minutes",
		"weather": "^2Current weather: ^7CLEAR",
		"time": "^2Current time: ^715:30",
		"say": "^6[ADMIN] ^7Hello everyone from the console!",
		"resources": "^2Loaded resources: ^7342 | Running: 298 | Stopped: 44",
		"memory": "^2Memory usage: ^72.1GB / 8.0GB (26%)",
		"cpu": "^2CPU usage: ^745%",
		"network": "^2Network: ^7In: 2.5MB/s | Out: 1.8MB/s",
		"version": "^2FXServer version: ^76683 | VexonAC: 4.5.0"
	};

	const commandLower = command.toLowerCase().trim();
	const commandBase = commandLower.split(' ')[0];
	
	if (responses[commandBase]) {
		return responses[commandBase];
	}
	
	// Handle dynamic commands
	if (commandLower.startsWith('kick ')) {
		const playerName = command.split(' ').slice(1).join(' ');
		return `^3[KICK] ^7Player ^5${playerName}^7 has been kicked from the server`;
	}
	
	if (commandLower.startsWith('ban ')) {
		const playerName = command.split(' ').slice(1).join(' ');
		return `^1[BAN] ^7Player ^5${playerName}^7 has been banned from the server`;
	}
	
	if (commandLower.startsWith('say ')) {
		const message = command.split(' ').slice(1).join(' ');
		return `^6[ADMIN] ^7${message}`;
	}
	
	if (commandLower.startsWith('weather ')) {
		const weather = command.split(' ')[1];
		return `^2Weather changed to: ^7${weather.toUpperCase()}`;
	}
	
	if (commandLower.startsWith('time ')) {
		const time = command.split(' ')[1];
		return `^2Time changed to: ^7${time}`;
	}
	
	// Default response for unknown commands
	return `^1[ERROR] ^7Unknown command: ^5${command}^7. Type 'help' for available commands.`;
};

interface ConsoleViewerProps {
	serverId: string;
	canRunCommands?: boolean;
}

// FiveM color mapping
const FIVEM_COLORS = {
	"^0": "\x1b[37m", // White
	"^1": "\x1b[31m", // Red
	"^2": "\x1b[32m", // Green
	"^3": "\x1b[33m", // Yellow
	"^4": "\x1b[34m", // Blue
	"^5": "\x1b[36m", // Light Blue
	"^6": "\x1b[35m", // Purple
	"^7": "\x1b[37m", // White
	"^8": "\x1b[91m", // Orange (bright red)
	"^9": "\x1b[90m", // Grey
} as const;

interface PresetCommandDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onExecute: (command: string) => void;
	commandType: string;
}

function PresetCommandDialog({ isOpen, onClose, onExecute, commandType }: PresetCommandDialogProps) {
	const [clearType, setClearType] = useState<string>("");
	const [banId, setBanId] = useState("");
	const [playerId, setPlayerId] = useState("");
	const [banReason, setBanReason] = useState("");

	const handleExecute = () => {
		let command = "";
		
		switch (commandType) {
			case "clear":
				if (clearType) {
					command = `vexonac clear ${clearType}`;
				}
				break;
			case "unban":
				if (banId.trim()) {
					command = `vexonac unban ${banId.trim()}`;
				}
				break;
			case "ban":
				if (playerId.trim() && banReason.trim()) {
					command = `vexonac ban ${playerId.trim()} ${banReason.trim()}`;
				}
				break;
		}
		
		if (command) {
			onExecute(command);
			onClose();
			// Reset form fields
			setClearType("");
			setBanId("");
			setPlayerId("");
			setBanReason("");
		}
	};

	const isFormValid = () => {
		switch (commandType) {
			case "clear":
				return clearType !== "";
			case "unban":
				return banId.trim() !== "";
			case "ban":
				return playerId.trim() !== "" && banReason.trim() !== "";
			case "uninstall":
				return true;
			default:
				return false;
		}
	};

	const getDialogTitle = () => {
		switch (commandType) {
			case "clear":
				return "Clear Entities";
			case "unban":
				return "Unban Player";
			case "ban":
				return "Ban Player";
			case "uninstall":
				return "Uninstall VexonAC";
			default:
				return "Execute Command";
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Shield className="h-4 w-4" />
						{getDialogTitle()}
					</DialogTitle>
				</DialogHeader>
				
				<div className="space-y-4 py-4">
					{commandType === "clear" && (
						<div className="space-y-2">
							<Label htmlFor="clearType">Entity Type</Label>
							<Select value={clearType} onValueChange={setClearType}>
								<SelectTrigger>
									<SelectValue placeholder="Select entity type to clear" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="peds">Peds</SelectItem>
									<SelectItem value="vehicles">Vehicles</SelectItem>
									<SelectItem value="objects">Objects</SelectItem>
									<SelectItem value="all">All Entities</SelectItem>
								</SelectContent>
							</Select>
						</div>
					)}
					
					{commandType === "unban" && (
						<div className="space-y-2">
							<Label htmlFor="banId">Ban ID</Label>
							<Input
								id="banId"
								value={banId}
								onChange={(e) => setBanId(e.target.value)}
								placeholder="Enter ban ID"
								className="font-mono"
							/>
						</div>
					)}
					
					{commandType === "ban" && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="playerId">Player ID</Label>
								<Input
									id="playerId"
									value={playerId}
									onChange={(e) => setPlayerId(e.target.value)}
									placeholder="Enter player ID"
									className="font-mono"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="banReason">Ban Reason</Label>
								<Input
									id="banReason"
									value={banReason}
									onChange={(e) => setBanReason(e.target.value)}
									placeholder="Enter ban reason"
								/>
							</div>
						</div>
					)}
					
					{commandType === "uninstall" && (
						<div className="rounded-lg bg-destructive/10 p-3">
							<p className="text-sm text-destructive">
								âš ï¸ This will completely uninstall VexonAC from your server. This action cannot be undone.
							</p>
						</div>
					)}
				</div>
				
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button 
						onClick={handleExecute} 
						disabled={!isFormValid()}
						variant={commandType === "uninstall" ? "destructive" : "default"}
					>
						Execute Command
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function ConsoleViewer({ serverId, canRunCommands = false }: ConsoleViewerProps) {
	const terminalRef = useRef<HTMLDivElement>(null);
	const terminal = useRef<Terminal | null>(null);
	const fitAddon = useRef<FitAddon | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [command, setCommand] = useState("");
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [showSearch, setShowSearch] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentMatch, setCurrentMatch] = useState(0);
	const [totalMatches, setTotalMatches] = useState(0);
	const [searchMatches, setSearchMatches] = useState<Array<{row: number, col: number, length: number}>>([]);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const searchDecorations = useRef<any[]>([]);
	const [showPresetDialog, setShowPresetDialog] = useState(false);
	const [selectedPresetCommand, setSelectedPresetCommand] = useState("");

	const { data: session } = useSession();

	// tRPC mutation for executing commands
	const executeCommandMutation = useMutation(
		trpc.servers.executeCommand.mutationOptions({
			onSuccess: () => {
				// Command was sent successfully - the result will come through websocket
				setCommand("");
			},
			onError: (error) => {
				toast.error(error.message || "Failed to execute command");
			},
		})
	);
	
	// Parse FiveM color codes and convert to ANSI escape sequences
	const parseFiveMColors = (text: string): string => {
		let parsed = text;
		Object.entries(FIVEM_COLORS).forEach(([code, ansi]) => {
			const regex = new RegExp(code.replace("^", "\\^"), "g");
			parsed = parsed.replace(regex, ansi);
		});
		// Reset color at the end
		return parsed + "\x1b[0m";
	};

	useEffect(() => {
		if (!terminalRef.current) return;

		// Initialize terminal
		terminal.current = new Terminal({
			cursorBlink: true,
			fontSize: 14,
			fontFamily: "JetBrains Mono Variable, monospace",
			lineHeight: 1.1,
			fontWeight: "300",
			fontWeightBold: "600",
			letterSpacing: 0.8,
			scrollback: 5000,
			// scrollback: 2500, //more or less equivalent to the legacy 250kb limit
			allowProposedApi: true,
			allowTransparency: true,
			overviewRulerWidth: 15,
			theme: {
				background: "#000D1E",
				foreground: "#f0f0f0",
				cursor: "#f0f0f0",
				black: "#0a0a0a",
				red: "#f44336",
				green: "#4caf50",
				yellow: "#ffeb3b",
				blue: "#42a5f5",
				magenta: "#9c27b0",
				cyan: "#03a9f4",
				white: "#f0f0f0",
				brightBlack: "#9e9e9e",
				brightRed: "#ff5722",
				brightGreen: "#4caf50",
				brightYellow: "#ffeb3b",
				brightBlue: "#42a5f5",
				brightMagenta: "#9c27b0",
				brightCyan: "#03a9f4",
				brightWhite: "#ffffff",
			},
		});

		fitAddon.current = new FitAddon();
		terminal.current.loadAddon(fitAddon.current);

		terminal.current.open(terminalRef.current);
		
		// Add a small delay to ensure DOM is fully rendered before fitting
		setTimeout(() => {
			if (fitAddon.current && terminal.current && terminalRef.current) {
				try {
					fitAddon.current.fit();
				} catch (error) {
					console.warn('Failed to fit terminal on initial load:', error);
					// Retry after another short delay
					setTimeout(() => {
						if (fitAddon.current && terminal.current && terminalRef.current) {
							try {
								fitAddon.current.fit();
							} catch (retryError) {
								console.warn('Failed to fit terminal on retry:', retryError);
							}
						}
					}, 100);
				}
			}
		}, 10);

		// Enable copy/paste with Ctrl+C/Ctrl+V
		terminal.current.attachCustomKeyEventHandler((event) => {
			// Handle Ctrl+C for copy
			if (event.ctrlKey && event.code === 'KeyC' && event.type === 'keydown') {
				if (terminal.current?.hasSelection()) {
					const selection = terminal.current.getSelection();
					navigator.clipboard.writeText(selection);
					return false; // Prevent default
				}
			}
			
			// Handle Ctrl+V for paste  
			if (event.ctrlKey && event.code === 'KeyV' && event.type === 'keydown') {
				navigator.clipboard.readText().then(text => {
					terminal.current?.paste(text);
				}).catch(() => {
					// Clipboard access failed, ignore silently
				});
				return false; // Prevent default
			}
			
			// Handle Ctrl+F for search
			if (event.ctrlKey && event.code === 'KeyF' && event.type === 'keydown') {
				event.preventDefault();
				setShowSearch(true);
				setTimeout(() => searchInputRef.current?.focus(), 100);
				return false; // Prevent default
			}
			
			return true; // Allow other key events
		});

		// Handle terminal resize with proper error handling
		const handleResize = () => {
			if (fitAddon.current && terminal.current && terminalRef.current) {
				try {
					// Check if the terminal container has valid dimensions
					const container = terminalRef.current;
					if (container.clientWidth > 0 && container.clientHeight > 0) {
						fitAddon.current.fit();
					}
				} catch (error) {
					console.warn('Failed to resize terminal:', error);
				}
			}
		};

		// Use ResizeObserver for better resize handling
		let resizeObserver: ResizeObserver | null = null;
		if (terminalRef.current && window.ResizeObserver) {
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
						// Debounce resize calls
						setTimeout(handleResize, 10);
					}
				}
			});
			resizeObserver.observe(terminalRef.current);
		}

		// Fallback to window resize event
		window.addEventListener("resize", handleResize);

		// Subscribe to console events
		webSocketService.on("console:output", handleConsoleOutput);
		webSocketService.on("console:connected", handleConsoleConnected);
		webSocketService.on("console:disconnected", handleConsoleDisconnected);
		webSocketService.on("console:command_result", handleCommandResult);

		// Listen for scroll events (simplified)
		const handleScroll = () => {
			// For now, just refresh highlights when scrolling
			if (searchTerm && searchMatches.length > 0) {
				setTimeout(() => {
					applyNewHighlighting(searchMatches, currentMatch - 1);
				}, 50);
			}
		};

		if (terminal.current) {
			terminal.current.onScroll(handleScroll);
		}

		// Demo mode or real websocket connection
		if (isDemoServer(serverId)) {
			// Demo mode - simulate console connection and load initial data
			setIsConnected(true);
			if (terminal.current) {
				terminal.current.writeln(`\x1b[32m✓ Connected to demo server console\x1b[0m\r\n`);
			}
			
			// Load demo console output
			const demoOutput = getDemoConsoleOutput();
			demoOutput.forEach((log) => {
				if (!terminal.current) return;
				
				const timestamp = new Date(log.timestamp).toLocaleTimeString();
				
				// Check if line starts with a channel name like [script:VexonAC], [cmd], etc.
				const channelMatch = log.output.match(/^(\[[^\]]+\])\s*(.*)$/);
				
				if (channelMatch) {
					const [, channelName, message] = channelMatch;
					const parsedMessage = parseFiveMColors(message);
					// Grey timestamp, grey channel name, then the actual message
					terminal.current?.writeln(`\x1b[90m[${timestamp}]\x1b[0m \x1b[90m${channelName}\x1b[0m ${parsedMessage}`);
				} else {
					const parsedOutput = parseFiveMColors(log.output);
					terminal.current?.writeln(`\x1b[90m[${timestamp}]\x1b[0m ${parsedOutput}`);
				}
			});
			
			// Simulate new messages coming in periodically
			const demoInterval = setInterval(() => {
				if (!terminal.current) return;
				
				const demoMessages = [
					"^2[INFO] ^7Player ^5NewPlayer${Math.floor(Math.random() * 1000)}^7 joined the server",
					"^6[CHAT] ^5RandomUser^7: Anyone selling cars?",
					"^3[WARN] ^7Server performance: Normal",
					"^5[ANTICHEAT] ^7VexonAC: System operational",
					"^6[CHAT] ^5AnotherPlayer^7: Great server!",
					"^2[INFO] ^7Auto-save completed"
				];
				
				const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
				const timestamp = new Date().toLocaleTimeString();
				const parsedOutput = parseFiveMColors(randomMessage);
				terminal.current.writeln(`\x1b[90m[${timestamp}]\x1b[0m ${parsedOutput}`);
			}, 15000); // New message every 15 seconds
			
			return () => {
				clearInterval(demoInterval);
				if (resizeObserver) {
					resizeObserver.disconnect();
				}
				window.removeEventListener("resize", handleResize);
				if (terminal.current) {
					terminal.current.dispose();
				}
			};
		} else {
			// Real server mode - use websocket
			// Subscribe to server console (handles reconnect automatically)
			webSocketService.subscribeToConsole(serverId);

			// Add connection timeout
			const connectionTimeout = setTimeout(() => {
				if (!isConnected && terminal.current) {
					terminal.current.writeln("\x1b[33m\u26a0  Connection timeout - server may be offline\x1b[0m\r\n");
				}
			}, 30000);

			return () => {
				clearTimeout(connectionTimeout);
				if (resizeObserver) {
					resizeObserver.disconnect();
				}
				window.removeEventListener("resize", handleResize);
				webSocketService.off("console:output", handleConsoleOutput);
				webSocketService.off("console:connected", handleConsoleConnected);
				webSocketService.off("console:disconnected", handleConsoleDisconnected);
				webSocketService.off("console:command_result", handleCommandResult);
				webSocketService.unsubscribeFromConsole(serverId);
				if (terminal.current) {
					terminal.current.dispose();
				}
			};
		}


	}, [serverId]);

	const handleConsoleOutput = (data: { serverId: string; output: string; timestamp: number }) => {
		if (data.serverId !== serverId || !terminal.current) {
			return;
		}

		const timestamp = new Date(data.timestamp).toLocaleTimeString();
		
		// Handle multi-line output
		const lines = data.output.split('\n');
		for (const line of lines) {
			if (line.trim().length > 0) {
				// Check if line starts with a channel name like [script:VexonAC], [cmd], etc.
				const channelMatch = line.match(/^(\[[^\]]+\])\s*(.*)$/);
				
				if (channelMatch) {
					const [, channelName, message] = channelMatch;
					const parsedMessage = parseFiveMColors(message);
					// Grey timestamp, grey channel name, then the actual message
					terminal.current.writeln(`\x1b[90m[${timestamp}]\x1b[0m \x1b[90m${channelName}\x1b[0m ${parsedMessage}`);
				} else {
					const parsedOutput = parseFiveMColors(line);
					terminal.current.writeln(`\x1b[90m[${timestamp}]\x1b[0m ${parsedOutput}`);
				}
			}
		}
	};

	const handleConsoleConnected = (data: { serverId: string }) => {
		if (data.serverId !== serverId || !terminal.current) {
			return;
		}

		setIsConnected(true);
		terminal.current.writeln(`\x1b[32m✓ Connected to server console\x1b[0m\r\n`);
	};

	const handleConsoleDisconnected = (data: { serverId: string; reason?: string }) => {
		if (data.serverId !== serverId || !terminal.current) return;

		setIsConnected(false);
		const reason = data.reason ? ` (${data.reason})` : "";
		terminal.current.writeln(`\x1b[31m✗ Disconnected from server console${reason}\x1b[0m\r\n`);
	};

	const handleCommandResult = (data: { serverId: string; command: string; success: boolean; output?: string }) => {
		if (data.serverId !== serverId || !terminal.current) return;
		
		if (data.output) {
			const parsedOutput = parseFiveMColors(data.output);
			terminal.current.writeln(parsedOutput);
		}
		terminal.current.writeln("");
	};

	const executeCommand = () => {
		if (!command.trim() || !canRunCommands || !isConnected || !terminal.current) return;

		// Add to history
		if (command.trim() !== commandHistory[commandHistory.length - 1]) {
			setCommandHistory(prev => [...prev, command.trim()].slice(-50)); // Keep last 50 commands
		}
		setHistoryIndex(-1);

		// Echo command in terminal
		terminal.current.writeln(`\x1b[36m> ${command.trim()}\x1b[0m`);

		if (isDemoServer(serverId)) {
			// Demo mode - simulate command execution
			const result = getDemoCommandResult(command.trim());
			const parsedResult = parseFiveMColors(result);
			terminal.current.writeln(parsedResult);
			terminal.current.writeln("");
		} else {
			// Real server mode - send command via tRPC
			executeCommandMutation.mutate({
				serverId,
				command: command.trim(),
			});
		}
		setCommand("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			executeCommand();
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (commandHistory.length > 0) {
				const newIndex = historyIndex === -1 
					? commandHistory.length - 1 
					: Math.max(0, historyIndex - 1);
				setHistoryIndex(newIndex);
				setCommand(commandHistory[newIndex]);
			}
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (historyIndex >= 0) {
				const newIndex = historyIndex + 1;
				if (newIndex >= commandHistory.length) {
					setHistoryIndex(-1);
					setCommand("");
				} else {
					setHistoryIndex(newIndex);
					setCommand(commandHistory[newIndex]);
				}
			}
		}
	};

	const clearConsole = () => {
		terminal.current?.clear();
		terminal.current?.writeln("\x1b[90mConsole cleared\x1b[0m\r\n");
	};

	const downloadLogs = () => {
		if (!terminal.current) return;
		
		try {
			// Get terminal content using the correct API
			const buffer = terminal.current.buffer.active;
			if (!buffer) {
				console.warn('Terminal buffer not available for download');
				toast.error('Console buffer not available');
				return;
			}
			
			const lines: string[] = [];
			
			for (let i = 0; i < buffer.length; i++) {
				const line = buffer.getLine(i);
				if (line) {
					lines.push(line.translateToString());
				}
			}
			
			const content = lines.join('\n');
			const blob = new Blob([content], { type: 'text/plain' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `console-${serverId}-${new Date().toISOString().slice(0, 19)}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading logs:', error);
			toast.error('Failed to download console logs');
		}
	};

	const reconnectConsole = () => {
		if (isDemoServer(serverId)) {
			// Demo mode - simulate reconnection
			setIsConnected(true);
			terminal.current?.writeln("\x1b[32m✓ Reconnected to demo server console\x1b[0m");
		} else {
			// Real server mode - reconnect via websocket
			webSocketService.subscribeToConsole(serverId);
			terminal.current?.writeln("\x1b[33m\u26a1 Reconnecting...\x1b[0m");
		}
	};

	// Simple function to clear all search highlights
	const clearAllHighlights = () => {
		if (!terminalRef.current) return;
		
		// Remove all highlight-related CSS classes and styles
		const terminalElement = terminalRef.current;
		
		// Remove any highlighted elements
		const highlightedElements = terminalElement.querySelectorAll('.search-match, .search-current');
		highlightedElements.forEach(el => {
			el.classList.remove('search-match', 'search-current');
			(el as HTMLElement).style.backgroundColor = '';
			(el as HTMLElement).style.border = '';
			(el as HTMLElement).style.boxShadow = '';
		});
		
		// Clear any inline styles on spans
		const allSpans = terminalElement.querySelectorAll('span[style*="background"]');
		allSpans.forEach(span => {
			const element = span as HTMLElement;
			element.style.backgroundColor = '';
			element.style.border = '';
			element.style.boxShadow = '';
		});
		
		// Clear decoration references
		searchDecorations.current = [];
	};

	// Brand new highlighting system - much simpler approach
	const applyNewHighlighting = (matches: Array<{row: number, col: number, length: number}>, currentIndex: number) => {
		if (!terminalRef.current) return;
		
		const terminalElement = terminalRef.current;
		
		// Clear any existing highlights
		clearAllHighlights();
		
		matches.forEach((match, index) => {
			try {
				// Get the row element
				const rows = terminalElement.querySelectorAll('.xterm-row');
				const rowElement = rows[match.row];
				if (!rowElement) return;
				
				// Get the row text
				const rowText = rowElement.textContent || '';
				
				// Split the text and create new content with highlights
				const beforeText = rowText.substring(0, match.col);
				const matchText = rowText.substring(match.col, match.col + match.length);
				const afterText = rowText.substring(match.col + match.length);
				
				// Create highlighted version
				const isCurrentMatch = index === currentIndex;
				const highlightClass = isCurrentMatch ? 'search-current' : 'search-match';
				const backgroundColor = isCurrentMatch ? 'rgba(138, 43, 226, 0.7)' : 'rgba(255, 182, 193, 0.6)';
				const border = isCurrentMatch ? '1px solid rgba(138, 43, 226, 1)' : 'none';
				
				// Create the highlighted span
				const highlightSpan = document.createElement('span');
				highlightSpan.className = highlightClass;
				highlightSpan.style.backgroundColor = backgroundColor;
				highlightSpan.style.border = border;
				highlightSpan.style.borderRadius = '3px';
				highlightSpan.style.padding = '1px 2px';
				highlightSpan.style.margin = '0 1px';
				highlightSpan.textContent = matchText;
				
				// Replace the row content
				rowElement.innerHTML = '';
				if (beforeText) rowElement.appendChild(document.createTextNode(beforeText));
				rowElement.appendChild(highlightSpan);
				if (afterText) rowElement.appendChild(document.createTextNode(afterText));
				
			} catch (e) {
				console.warn('Failed to highlight match:', e);
			}
		});
	};

	// Brand new simple search functionality
	const performSearch = (term: string, updateCounts: boolean = true) => {
		if (!terminal.current || !term) {
			clearAllHighlights();
			setSearchMatches([]);
			setTotalMatches(0);
			setCurrentMatch(0);
			return;
		}
		
		// Safety check: ensure terminal buffer is properly initialized
		try {
			const buffer = terminal.current.buffer.active;
			if (!buffer) {
				console.warn('Terminal buffer not available for search');
				return;
			}
			
			const searchTerm = term.toLowerCase();
			const matches: Array<{row: number, col: number, length: number}> = [];
			
			// Clear all previous highlights
			clearAllHighlights();
			
			// Find all matches in the buffer
			for (let i = 0; i < buffer.length; i++) {
				const line = buffer.getLine(i);
				if (line) {
					const lineText = line.translateToString().toLowerCase();
					let startIndex = 0;
					
					while (true) {
						const index = lineText.indexOf(searchTerm, startIndex);
						if (index === -1) break;
						
						matches.push({
							row: i,
							col: index,
							length: searchTerm.length
						});
						
						startIndex = index + 1;
					}
				}
			}
			
			// Apply the new highlighting system
			applyNewHighlighting(matches, 0);
			
			if (updateCounts) {
				setSearchMatches(matches);
				setTotalMatches(matches.length);
				setCurrentMatch(matches.length > 0 ? 1 : 0);
			}
			
			// Scroll to first match if found
			if (matches.length > 0 && terminal.current) {
				try {
					terminal.current.scrollToLine(matches[0].row);
				} catch (scrollError) {
					console.warn('Failed to scroll to search result:', scrollError);
				}
			}
		} catch (error) {
			console.warn('Error during search operation:', error);
			clearAllHighlights();
			setSearchMatches([]);
			setTotalMatches(0);
			setCurrentMatch(0);
		}
	};



	const navigateSearch = (direction: 'next' | 'previous') => {
		if (searchMatches.length === 0) return;
		
		let newIndex;
		if (direction === 'next') {
			newIndex = currentMatch >= totalMatches ? 1 : currentMatch + 1;
		} else {
			newIndex = currentMatch <= 1 ? totalMatches : currentMatch - 1;
		}
		
		setCurrentMatch(newIndex);
		
		// Apply highlighting with new current match
		applyNewHighlighting(searchMatches, newIndex - 1);
		
		// Scroll to the current match
		const match = searchMatches[newIndex - 1];
		if (match && terminal.current) {
			try {
				terminal.current.scrollToLine(match.row);
			} catch (error) {
				console.warn('Failed to scroll to search match:', error);
			}
		}
	};

	const closeSearch = () => {
		clearAllHighlights();
		
		// Remove all existing highlights from DOM
		if (terminalRef.current) {
			const highlights = terminalRef.current.querySelectorAll('[data-search-highlight], [data-search-highlight-current]');
			highlights.forEach(highlight => {
				const parent = highlight.parentNode;
				if (parent) {
					parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
					parent.normalize();
				}
			});
		}
		
		setShowSearch(false);
		setSearchTerm("");
		setSearchMatches([]);
		setTotalMatches(0);
		setCurrentMatch(0);
		terminal.current?.focus();
	};

	const executePresetCommand = (command: string) => {
		if (!command.trim() || !canRunCommands || !isConnected || !terminal.current) return;

		// Add to command history
		if (command.trim() !== commandHistory[commandHistory.length - 1]) {
			setCommandHistory(prev => [...prev, command.trim()].slice(-50));
		}
		setHistoryIndex(-1);

		// Echo command in terminal
		terminal.current.writeln(`\x1b[36m> ${command.trim()}\x1b[0m`);

		if (isDemoServer(serverId)) {
			// Demo mode - simulate command execution
			const result = getDemoCommandResult(command.trim());
			const parsedResult = parseFiveMColors(result);
			terminal.current.writeln(parsedResult);
			terminal.current.writeln("");
		} else {
			// Real server mode - send command via tRPC
			executeCommandMutation.mutate({
				serverId,
				command: command.trim(),
			});
		}
	};

	return (
		<Card className="h-full flex flex-col space-y-0 py-0 gap-0">
			{/* Header */}
			<CardHeader className="flex-none p-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 min-w-0">
						<div className="flex items-center gap-2">
							<TerminalIcon className="h-4 w-4" />
							<span className="text-sm font-medium">Live Console</span>
							{isDemoServer(serverId) && (
								<Badge variant="secondary" className="text-xs">
									Demo
								</Badge>
							)}
							{!isDemoServer(serverId) && (
								<Badge 
									variant={isConnected ? "default" : "destructive"} 
									className="text-xs"
								>
									{isConnected ? "Connected" : "Disconnected"}
								</Badge>
							)}
						</div>
					</div>
					
					{/* Action Buttons */}
					<div className="flex items-center gap-1">
						<Button
							variant="ghost" 
							size="sm"
							onClick={() => setShowSearch(true)}
							className="h-8 w-8 p-0 sm:w-auto sm:px-3"
							title="Search (Ctrl+F)"
						>
							<Search className="h-4 w-4" />
							<span className="ml-1 hidden sm:inline">Search</span>
						</Button>

						<Button
							variant="ghost" 
							size="sm"
							onClick={downloadLogs}
							className="h-8 w-8 p-0 sm:w-auto sm:px-3"
							title="Download Logs"
						>
							<Download className="h-4 w-4" />
							<span className="ml-1 hidden sm:inline">Download</span>
						</Button>
						
						<Button
							variant="ghost" 
							size="sm"
							onClick={clearConsole}
							className="h-8 w-8 p-0 sm:w-auto sm:px-3"
							title="Clear Console"
						>
							<Trash2 className="h-4 w-4" />
							<span className="ml-1 hidden sm:inline">Clear</span>
						</Button>

						{!isConnected && (
							<Button
								variant="ghost"
								size="sm"
								onClick={reconnectConsole}
								className="h-8 w-8 p-0 sm:w-auto sm:px-3"
								title="Reconnect"
							>
								<Play className="h-4 w-4" />
								<span className="ml-1 hidden sm:inline">Reconnect</span>
							</Button>
						)}
					</div>
				</div>
			</CardHeader>

			{/* Search Bar */}
			{showSearch && (
				<div className="flex-none border-b bg-background p-2">
					<div className="flex items-center gap-1 bg-muted/30 rounded-md px-2 py-1">
						<Input
							ref={searchInputRef}
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								// Auto-search as user types
								if (e.target.value) {
									performSearch(e.target.value);
								} else {
									setSearchMatches([]);
									setTotalMatches(0);
									setCurrentMatch(0);
								}
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									navigateSearch(e.shiftKey ? 'previous' : 'next');
								} else if (e.key === 'Escape') {
									e.preventDefault();
									closeSearch();
								}
							}}
							placeholder="dad"
							className="flex-1 h-7 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm font-mono px-1"
							autoFocus
						/>
						
						{/* Match counter */}
						<div className="flex items-center text-xs text-muted-foreground min-w-[3rem]">
							{totalMatches > 0 ? (
								<span>{currentMatch}/{totalMatches}</span>
							) : searchTerm ? (
								<span>0/0</span>
							) : null}
						</div>
						
						{/* Navigation buttons */}
						<div className="flex items-center">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigateSearch('previous')}
								disabled={totalMatches === 0}
								className="h-6 w-6 p-0 hover:bg-muted"
							>
								<ChevronUp className="h-3 w-3" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigateSearch('next')}
								disabled={totalMatches === 0}
								className="h-6 w-6 p-0 hover:bg-muted"
							>
								<ChevronDown className="h-3 w-3" />
							</Button>
						</div>
						
						{/* Close button */}
						<Button
							variant="ghost"
							size="sm"
							onClick={closeSearch}
							className="h-6 w-6 p-0 hover:bg-muted ml-1"
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
				</div>
			)}

			{/* Terminal Display */}
			<CardContent className="flex-1 p-0 overflow-hidden border-t relative">
				<div 
					ref={terminalRef} 
					className={cn(
						"h-full w-full bg-[#000D1E] console-terminal",
						showSearch && searchTerm && "searching"
					)}
				/>
			</CardContent>

			{/* Command Input - Fixed at bottom */}
			{canRunCommands && (
				<div className="flex-none border-t bg-card p-3 sm:p-4">
					<div className="flex gap-2">
						{/* Preset Commands Dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="shrink-0 hover:bg-primary/10 border-primary/20"
									disabled={!isConnected}
									title="VexonAC Commands"
								>
									<Command className="h-4 w-4 text-primary" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="w-80 p-2">
								<div className="px-2 py-1.5 mb-2 border-b">
									<div className="flex items-center gap-2 text-sm font-medium">
										<Shield className="h-4 w-4 text-primary" />
										VexonAC Commands
									</div>
								</div>
								
								<div className="space-y-1">
									<div 
										className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 cursor-pointer"
										onClick={() => {
											setSelectedPresetCommand("clear");
											setShowPresetDialog(true);
										}}
									>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1 text-sm font-medium">
												Clear Entities
											</div>
											<p className="text-xs text-muted-foreground">
												Remove peds, vehicles, objects or all entities from the server
											</p>
										</div>
									</div>
									
									<div 
										className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 cursor-pointer"
										onClick={() => {
											setSelectedPresetCommand("ban");
											setShowPresetDialog(true);
										}}
									>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1 text-sm font-medium">
												Ban Player
											</div>
											<p className="text-xs text-muted-foreground">
												Permanently ban a player
											</p>
										</div>
									</div>
									
									<div 
										className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 cursor-pointer"
										onClick={() => {
											setSelectedPresetCommand("unban");
											setShowPresetDialog(true);
										}}
									>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1 text-sm font-medium">
												Unban Player
											</div>
											<p className="text-xs text-muted-foreground">
												Remove player ban by ID
											</p>
										</div>
									</div>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>

						<div className="flex-1 relative">
							<Input
								value={command}
								onChange={(e) => setCommand(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder={isConnected ? "Type a command..." : "Not connected"}
								disabled={!isConnected}
								className="font-mono pr-10 bg-background/50 focus:bg-background"
							/>
							{commandHistory.length > 0 && (
								<div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hidden sm:block">
									â†'â†"
								</div>
							)}
						</div>
						<Button
							onClick={executeCommand}
							disabled={!command.trim() || !isConnected || executeCommandMutation.isPending}
							size="icon"
							className="shrink-0"
						>
							<Send className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Preset Command Dialog */}
			<PresetCommandDialog
				isOpen={showPresetDialog}
				onClose={() => setShowPresetDialog(false)}
				onExecute={executePresetCommand}
				commandType={selectedPresetCommand}
			/>
		</Card>
	);
} 
