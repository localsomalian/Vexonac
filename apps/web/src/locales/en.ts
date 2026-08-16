export default {
  sidebar: {
    customer_area: "Customer Area",
    dashboard: "Dashboard",
    redeem: "Redeem",
    download: "Download",
    support: "Support",
    documentation: "Documentation",
    logout: "Logout",
    theme: "Theme",
    language: "Language",
    light: "Light",
    dark: "Dark",
    system: "System",
    configuration: "Configuration",
    admins: "Admins",
    console: "Console",
    players: "Players",
    bans: "Bans",
    logs: "Logs",
    configuration_library: "Configuration Library",
    models: "Models",
    lookup: "Lookup",
    map: "Interactive Map",
    multistream: "Multi Stream",
  },
  dashboard: {
    title: "Dashboard",
    vexonac_version: "VexonAC Version",
    connected_servers: "Connected Servers",
    protected_players: "Protected Players",
    vexonac_status: "VexonAC Status",
    my_servers: "My Servers",
    servers_summary:
      "{online} of {total} servers online • {players} players • {bans} bans",
    view_all: "View All",
    manage: "Manage",
    no_servers_found: "No servers found",
    no_servers_description:
      "You don't have any servers yet. Get started by adding a server.",
    add_server: "Add Server",
    latest_updates: "Latest Updates",
    recent_changes: "Recent changes to VexonAC",
    recent_activity: "Recent Activity",
    latest_events: "Latest events across your servers",
    online: "Online",
    offline: "Offline",
    players: "Players",
    bans: "Bans",
    currently_active: "Currently active",
    last_active: "Last active {time}",
    across_network: "Across the VexonAC network",
    online_players: "Online players across all servers",
    online_servers: "Online servers across all servers",
    global_status: "Global VexonAC network status",
    uptime: "{uptime}% uptime",
    was_banned: "{player} was banned on {server}",
    triggered_detection: "{player} triggered detection on {server}",
    server_updated: "{server} {details}",
    released: "Released",
  },
  server_dashboard: {
    dashboard: "Dashboard",
    server_dashboard: "Server Dashboard",
    server_dashboard_description:
      "Manage your server with tools for monitoring and management",
    server_status: "Server Status",
    online: "Online",
    offline: "Offline",
    update_to_version: "Update to v{version}",
    server_ip: "Server IP",
    not_set: "Not set",
    reset_ip: "Reset IP",
    reset_server_ip: "Reset Server IP",
    reset_ip_confirmation:
      "Are you sure you want to reset the server IP? This action cannot be undone. Your server will need to be reconfigured with the new IP address.",
    cancel: "Cancel",
    restricted_access: "Restricted access",
    license_key: "License Key",
    license_key_copied: "License key copied to clipboard",
    hide: "Hide",
    show: "Show",
    copy: "Copy",
    license_expiration: "License Expiration",
    days: "days",
    expired: "Expired",
    renew_license: "Renew License",
    delete_server: "Delete Server",
    delete_server_confirmation:
      "Are you sure you want to delete this server? This action cannot be undone. All data associated with this server will be permanently deleted.",
    server_analytics: "Server Analytics",
    server_analytics_description:
      "Player statistics and server performance metrics",
    today: "Today",
    last_7_days: "Last 7 Days",
    last_30_days: "Last 30 Days",
    current_players: "Current Players",
    banned_players: "Banned Players",
    peak_players: "Peak Players",
    average_players: "Average Players",
    last_24h: "(last 24h)",
    this_week: "(this week)",
    this_month: "(this month)",
    server_not_found: "Server Not Found",
    server_not_found_description:
      "The server you're looking for doesn't exist or you don't have permission to view it.",
    return_to_dashboard: "Return to Dashboard",
    bans: "Bans",
    players: "Players",
    ip_reset_success: "IP reset successfully",
    ip_reset_error: "Failed to reset IP",
    server_deleted: "Server deleted successfully",
    server_delete_error: "Failed to delete server",
  },
  redeem: {
    title: "Redeem",
    redeem_your_license: "Redeem Your License Key",
    enter_license_key_description:
      "Enter your license key below to activate your product or renew an existing server.",
    license_key: "License Key",
    redeem_option: "Redeem Option",
    create_new_server: "Create New Server",
    create_new_server_description: "Create a new server with this license key",
    extend_existing_server: "Extend Existing Server",
    extend_existing_server_description:
      "Add time to one of your existing servers",
    no_servers_available_description:
      "You don't have any servers yet to extend",
    server_name: "Server Name",
    enter_server_name: "Enter a name for your new server",
    select_server: "Select Server",
    select_server_placeholder: "Choose a server to extend",
    no_servers_available: "No servers available",
    redeem_license: "Redeem License",
    processing: "Processing...",
    redemption_successful: "Redemption Successful",
    server_name_label: "Server Name",
    expires_on: "Expires On",
    go_to_dashboard: "Go to Dashboard",
    license_type: "License Type",
    never_expires: "Never Expires",
  },
  download: {
    title: "Download",
    download_description: "Download and start using VexonAC now!",
    download_vexonac: "Download VexonAC",
    description:
      "Download the latest version of VexonAC Anti-Cheat for your servers",
    choose_license: "Choose a License",
    select_server: "Select a Server",
    no_licenses: "No Active Licenses",
    no_licenses_description:
      "You don't have any active licenses. Redeem a license key to get started.",
    redeem_license: "Redeem License",
    downloading: "Downloading...",
    installation_guide: "Installation Guide",
    installation_steps_title: "Quick Installation Steps",
    installation_step_1:
      "Place the VexonAC folder in your /resources directory (not in a subfolder)",
    installation_step_2:
      'Add the following to the TOP of your server.cfg file:',
    installation_step_3: "Start your server and enjoy your protection!",
    read_more: "Read the full installation guide",
    common_issues: "Common Issues",
    common_issue_1:
      'You CANNOT rename the script, it must be called "VexonAC"',
    common_issue_2: "The script must be started BEFORE any other resources",
    common_issue_3:
      "The folder must be placed directly in /resources, not in a subfolder",
    server_name: "Server Name",
    expires_on: "Expires",
    need_help: "Need help?",
    join_discord: "Join our Discord",
    expired: "Expired",
    never_expires: "Never Expires",
  },
  server_configuration: {
    configuration: "Configuration",
    configuration_description: "Manage your server's configuration",
    dashboard: "Dashboard",
    my_server: "My Server",
    access_denied: "Access Denied",
    access_denied_description:
      "You don't have permission to access this server's configuration. Please contact the server owner for access.",
    search_placeholder: "Search configuration options...",
    import: "Import",
    share: "Share",
    reset: "Reset to Default",
    cancel_changes: "Cancel Changes",
    save_changes: "Save Changes",
    search_results: "Search Results",
    search_results_description:
      "Found the following matching configuration options",
    import_config: "Import Configuration",
    import_config_description:
      "Enter a configuration ID to import settings from another server.",
    import_id_placeholder: "Enter configuration ID (e.g., ws1a2b3c4)",
    import_id_required: "Please enter a configuration ID",
    share_config: "Share Configuration",
    reset_config: "Reset Configuration",
    reset_config_description:
      "This will reset all settings to default values. This action cannot be undone.",
    cancel: "Cancel",
    copy: "Copy",
    config_saved_success: "Configuration saved successfully",
    config_saved_error: "Failed to save configuration",
    config_shared_success: "Configuration shared successfully",
    config_shared_id: "Configuration ID: {id}",
    copied_to_clipboard: "Copied to clipboard",
    config_imported_success: "Configuration imported successfully",
    config_imported_error: "Failed to import configuration",
    main_description: "Core protection and detection features",
    weapons_description: "Weapon related protection features",
    entities_description: "Entity management and protection features",
    explosions_description: "Explosion and particle effect controls",
    premium_description: "Premium features for enhanced protection",
    beta_description: "Experimental beta features",
    settings_description: "General settings and configuration options",
    unsaved_changes: "You have unsaved changes. Don't forget to save them.",
    loading_configuration: "Loading configuration...",
    share_dialog_description:
      "Share your configuration with others. Set it to public to make it searchable in the marketplace.",
    configuration_name: "Name",
    configuration_name_placeholder: "My Custom Configuration",
    description_optional: "Description (Optional)",
    description_placeholder:
      "Describe what makes this configuration special...",
    tags_max_5: "Tags (Max 5)",
    tags_selected: "{count}/5 tags selected",
    make_public_marketplace: "Make public (searchable in marketplace)",
    share_configuration: "Share Configuration",
  },
  config_library: {
    title: "Configuration Library",
    dashboard: "Dashboard",
    browse_public: "Browse Public",
    my_configurations: "My Configurations",
    search_filters: "Search & Filters",
    search_placeholder: "Search configurations...",
    sort_by: "Sort by",
    newest_first: "Newest First",
    oldest_first: "Oldest First",
    most_popular: "Most Popular",
    name_az: "Name A-Z",
    tags: "Tags",
    no_configs_found: "No configurations found",
    no_configs_description:
      "Try adjusting your search criteria or check back later for new configurations.",
    configs_found: "configurations found",
    previous: "Previous",
    next: "Next",
    sign_in_required: "Sign in required",
    sign_in_description:
      "You need to be signed in to view your configurations.",
    your_shared_configs: "Your Shared Configurations",
    no_configs_shared: "No configurations shared yet",
    no_configs_shared_description:
      "Share your first configuration to see it listed here.",
    preview: "Preview",
    import: "Import",
    importing: "Importing...",
    created_by: "Created by",
    public: "Public",
    private: "Private",
    edit_details: "Edit Details",
    make_private: "Make Private",
    make_public: "Make Public",
    copy_share_id: "Copy Share ID",
    delete: "Delete",
    config_preview: "Configuration Preview",
    config_data: "Configuration Data:",
    failed_to_load: "Failed to load configuration details",
    edit_config: "Edit Configuration",
    edit_config_description:
      "Update the details for your shared configuration.",
    name: "Name",
    description: "Description",
    make_public_searchable: "Make public (searchable in library)",
    cancel: "Cancel",
    save_changes: "Save Changes",
    delete_config: "Delete Configuration",
    delete_config_description:
      "Are you sure you want to delete this configuration? This action cannot be undone and will remove the configuration from the library permanently.",
    share_id_copied: "Share ID copied to clipboard",
    config_id_copied: "Configuration ID copied to clipboard",
    config_id_copied_description:
      "Go to your server configuration page to import it",
    failed_to_copy: "Failed to copy configuration ID to clipboard",
    config_updated: "Configuration updated successfully",
    failed_to_update: "Failed to update configuration",
    config_deleted: "Configuration deleted successfully",
    failed_to_delete: "Failed to delete configuration",
    no_description: "No description provided",
    no_tags: "No tags",
    unknown_user: "Unknown User",
    you: "You",
    max_tags: "{count}/5 tags selected",
    page_of: "Page {page} of {total}",
  },
  bans_page: {
    // Page header
    ban_management: "Ban Management",
    manage_player_bans_description:
      "Manage player bans and view ban history for your server",
    ban_offline: "Ban Offline",
    unban_all: "Unban All",
    unbanning_all: "Unbanning all players...",
    confirm_unban_all: "Are you sure you want to unban all players?",
    confirm_unban_all_description:
      "This action will unban all players from the server. This is a permanent action and cannot be undone.",
    // Access denied
    access_denied: "Access Denied",
    access_denied_description:
      "You don't have permission to manage bans for this server.",

    // Filters & Search
    filters_search: "Filters & Search",
    filters_search_description:
      "Search and filter bans by Ban ID, reason, or player name",
    search_placeholder: "Search by Ban ID, reason, or player name...",

    // Sort options
    newest_first: "Newest First",
    oldest_first: "Oldest First",
    expires_latest: "Expires Latest",
    expires_soonest: "Expires Soonest",
    most_playtime: "Most Playtime",
    least_playtime: "Least Playtime",

    // Table headers
    player: "Player",
    ban_id: "Ban ID",
    reason: "Reason",
    evidence: "Evidence",
    status: "Status",
    banned_at: "Banned At",
    first_join: "First Join",
    actions: "Actions",

    // Table content
    played: "Played",
    no_reason_provided: "No reason provided",
    no_evidence: "No evidence",
    view_evidence: "View Evidence",
    view_video: "View Video",

    // Ban status
    permanent: "Permanent",
    expired: "Expired",
    expires_in: "Expires {time}",

    // Pagination
    showing_results: "Showing {start} to {end} of {total} results",
    previous: "Previous",
    next: "Next",

    // Loading states
    loading: "Loading...",
    loading_ban_records: "Loading ban records...",

    // Empty states
    no_bans_found: "No Bans Found",
    no_bans_description: "No ban records match your current search criteria.",

    // Ban records
    ban_records: "Ban Records",
    total_bans_found: "{count} total ban{plural} found",

    // Actions
    unban_confirmation: "Are you sure you want to unban {playerName}?",
    unban_success: "Successfully unbanned {playerName}",
    unban_error: "Failed to unban player",
    unbanning: "Unbanning...",
    unban_player: "Unban Player",

    // Ban Details Dialog
    ban_details: "Ban Details",
    ban_details_description: "Detailed information about this ban record",
    ban_infos: "Ban Infos",
    player_infos: "Player Infos",
    identifiers: "Identifiers",
    ban_expiration: "Ban Expiration",
    additional_details: "Additional Details",
    cross_server_bans: "Cross-Server Bans",
    banned_identifiers: "Banned Identifiers",
    close: "Close",

    // Player info
    player_name: "Player Name",
    play_time: "Play Time",
    last_join: "Last Join",

    // Ban Player Dialog
    ban_player: "Ban Player",
    ban_player_description:
      "Search for a player or enter their identifier manually to issue a ban.",
    player_selection: "Player Selection",
    search_player_placeholder:
      "Search for a player by name, license, Steam ID, Discord ID, or any identifier...",
    no_players_found: "No players found.",
    matches: "Matches",
    more: "more",
    joined: "Joined",
    clear: "Clear",
    or: "or",
    enter_identifier_placeholder:
      "Enter player identifier manually (license, name, steam ID, etc.)",
    enter_identifier_description: "You can enter any player identifier.",

    // Ban form
    ban_reason: "Ban Reason",
    ban_reason_placeholder: "Enter the reason for this ban...",
    ban_reason_description: "Provide a clear reason for the ban (required)",
    evidence_url: "Evidence URL",
    evidence_url_placeholder: "https://example.com/evidence.png",
    evidence_url_description:
      "Optional link to evidence (image, video, or document)",
    ban_type: "Ban Type",
    permanent_ban: "Permanent Ban",
    temporary_ban: "Temporary Ban",
    ban_duration: "Ban Duration",
    ban_duration_description: "How long should this ban last?",
    hours: "Hours",
    days: "Days",
    weeks: "Weeks",
    months: "Months",

    // Selected player
    selected_player: "Selected Player",
    name: "Name",
    license: "License",

    // Form actions
    cancel: "Cancel",
    banning: "Banning...",

    // Form validation
    player_identifier_required: "Player identifier is required",
    player_identifier_too_long: "Player identifier too long",
    ban_reason_required: "Ban reason is required",
    ban_reason_too_long: "Ban reason too long (max 1000 characters)",
    evidence_url_invalid: "Must be a valid URL",
    evidence_url_too_long: "Evidence URL too long",
    duration_min: "Duration must be at least 1 hour",
    duration_max: "Duration cannot exceed 1 year",

    // Cross-server bans
    banned_on_servers: "Banned on {count} other servers",
    banned: "Banned",
    no_banned_identifiers: "No banned identifiers found",

    // Model lookup
    view_in_models: "Search in Models",
  },
  lookup: {
    // Page header
    player_lookup: "Player Lookup",
    lookup_dashboard: "Lookup Dashboard",
    search_analyze_description:
      "Search and analyze player reputation across servers",

    // Access denied
    access_denied: "Access Denied",
    access_denied_description:
      'You don\'t have permission to lookup players on this server. Contact the server owner to get the "Players Lookup" permission.',

    // Search section
    search_players: "Search Players",
    search_players_description:
      "Search for players by name, license, or any identifier to analyze their reputation",
    search_placeholder: "Search by player name, license, or identifier...",
    searching_players: "Searching players...",
    no_players_found: 'No players found matching "{search}"',
    type_characters: "Type at least 3 characters to search for players",
    clear: "Clear",

    // Search results
    played: "Played",
    last_seen: "Last seen",
    matches: "Matches",
    identifier: "identifier",
    identifiers: "identifiers",

    // Trust Score
    trust_score: "Threat Score",
    trust_score_description: "Player reputation analysis",
    perfect_trust: "Perfect Trust (0)",
    neutral: "Neutral (50)",
    maximum_risk: "Maximum Risk (100)",

    // Risk levels
    risk_low: "LOW",
    risk_medium: "MEDIUM",
    risk_high: "HIGH",
    risk_critical: "CRITICAL",

    // Trust score factors
    cross_server_bans: "Cross-Server Bans",
    account_age: "Account Age",
    play_time_factor: "Play Time",
    patterns: "Patterns",
    identifier_stability: "Identifier Stability",
    server_history: "Server History",
    recent_activity: "Recent Activity",

    // Factor descriptions
    factor_risk: "risk",
    factor_none: "none",
    factor_trusted: "trusted",
    factor_new: "new",
    factor_unknown: "unknown",
    factor_low: "low",
    factor_neutral: "neutral",
    factor_suspicious: "suspicious",
    factor_clean: "clean",

    // Warnings
    warnings: "Warnings",

    // Player info
    player_name_label: "Player Name",
    player_reputation_analysis: "Player reputation analysis",
    play_time_label: "Play Time",
    first_join: "First Join",
    last_join: "Last Join",
    license_label: "License",

    // Tabs
    current_identifiers: "Current Identifiers",
    previous_identifiers: "Previous Identifiers",
    alt_accounts: "Alt Accounts",
    active_bans_tab: "Active Bans",

    // Identifier section
    identifier_summary: "Identifier Summary",
    total_identifiers: "Total Identifiers",
    identifier_changes: "Identifier Changes",
    frequent_changes_warning:
      "Frequent identifier changes may indicate ban evasion attempts.",

    // Alt accounts
    no_alt_accounts: "No alt accounts found",
    matching_ids: "Matching IDs",
    current_server: "Current Server",

    // Bans section
    no_bans_found: "No bans found",
    server_bans: "Server Bans",
    cross_server_bans_section: "Cross-Server Bans",
    server: "Server",
    player_column: "Player",
    reason: "Reason",
    evidence: "Evidence",
    date: "Date",
    direct_ban: "Direct Ban",
    alt_account: "Alt Account",
    no_reason_provided: "No reason provided",
    no_evidence: "No evidence",
    view_evidence: "View evidence",
    view_video: "View video",

    // Actions
    ban_player_action: "Ban Player",
    banned_status: "Banned",
    close: "Close",

    // Ban dialog
    ban_player_description:
      "Ban {playerName} from the server. This action cannot be undone.",
    ban_reason_dialog: "Ban Reason",
    ban_reason_placeholder_dialog:
      "Enter the reason for banning this player...",
    ban_reason_description_dialog: "characters",
    evidence_url_dialog: "Evidence URL (optional)",
    evidence_url_placeholder_dialog: "https://example.com/evidence.png",
    ban_type_dialog: "Ban Type",
    permanent_ban_dialog: "Permanent Ban",
    temporary_ban_dialog: "Temporary Ban",
    duration_hours: "Duration (hours)",
    duration_max: "Maximum: 8760 hours (1 year)",
    cancel_dialog: "Cancel",
    banning: "Banning...",

    // Help section
    how_to_use: "How to use Player Lookup",
    search_players_help: "Search Players",
    search_players_help_description:
      "Search for players by name, license, or any identifier. The system will search through current and historical identifiers.",
    trust_score_help: "Threat Score",
    trust_score_help_description:
      "Each player gets a threat score based on cross-server bans, account age, play time, and more.",
    alt_accounts_help: "Alt Accounts",
    alt_accounts_help_description:
      "Find potential alt accounts by matching identifiers across servers. Privacy is maintained for other servers.",
    ban_history_help: "Ban History",
    ban_history_help_description:
      "View complete ban history including cross-server bans to assess player reputation.",

    // Media modal
    evidence_modal: "Evidence",

    // Loading states
    loading: "Loading...",
    loading_player_data: "Loading player data...",

    // Error states
    player_not_found: "Player not found",
    unable_to_load: "Unable to load player data. Please try again.",

    // Success messages
    ban_success: "Successfully banned {playerName}",
    ban_error: "Failed to ban player",
    identifier_copied: "Identifier copied to clipboard",
  },
  models: {
    // Page header
    title: "Models Lookup",
    dashboard: "Dashboard",
    description:
      "Search for GTA V models by name or hash. Find vehicles, peds, weapons, and objects.",

    // Header info
    models_count: "{count} models",

    // View modes
    grid_view: "Grid View",
    list_view: "List View",

    // Actions
    export_csv: "Export CSV",
    copy_name: "Copy Name",
    copy_hash: "Copy Hash",

    // Search and filters
    search_filters: "Search & Filters",
    search_filters_description:
      "Search by model name or hash, and filter by model type",
    search_placeholder: "Search by model name or hash...",
    filter_by_type: "Filter by Type",

    // Model types
    all_types: "All Types",
    vehicles: "Vehicles",
    peds: "Peds",
    weapons: "Weapons",
    objects: "Objects",
    explosions: "Explosions",
    vehicle: "Vehicle",
    ped: "Ped",
    weapon: "Weapon",
    object: "Object",
    explosion: "Explosion",

    // Quick filters
    all_models: "All ({count})",
    vehicles_count: "Vehicles ({count})",
    peds_count: "Peds ({count})",
    weapons_count: "Weapons ({count})",
    objects_count: "Objects ({count})",
    explosions_count: "Explosions ({count})",

    // Active filters
    active_filters: "Active filters:",
    search_filter: 'Search: "{query}"',
    type_filter: "Type: {type}",

    // Table headers
    preview: "Preview",
    model_name: "Model Name",
    hash: "Hash",
    type: "Type",
    actions: "Actions",

    // Empty states
    no_models_found: "No models found",
    no_models_search: 'No models match "{query}"',
    no_models_filter: "No models available for the selected filter",

    // Pagination
    showing_results: "Showing {start} to {end} of {total} models",
    previous: "Previous",
    next: "Next",
    page_of: "Page {page} of {total}",

    // Toast messages
    name_copied: "Model name copied to clipboard!",
    hash_copied: "Hash copied to clipboard!",
    csv_exported: "Exported {count} models to CSV!",

    // Fallback messages
    image_not_available: "Image not available",

    // Loading states
    loading: "Loading...",
    loading_models: "Loading models...",
  },
  interactive_map: {
    // Page header
    title: "Interactive Map",
    dashboard: "Dashboard",
    description:
      "View and watch your players and spawned entities in real time on the map.",

    // Map controls
    map_controls: "Map Controls",
    map_style: "Map Style",

    // Player filters
    filter_players: "Filter Players",
    search_placeholder: "Search by name or ID...",
    player_filters: "Player Filters",
    recently_connected: "Recently Connected",
    recently_connected_desc: "Players online < 1 hour",
    low_playtime: "Low Playtime",
    low_playtime_desc: "Playtime < 60 minutes",
    show_admins: "Show Admins",
    show_admins_desc: "Administrator players only",

    // Player list
    players: "Players",
    no_players_found: "No players found",

    // Player info
    player: "Player",
    id: "ID",
    status: "Status",
    online: "Online",
    vehicle: "Vehicle",
    in_vehicle: "In Vehicle",
    role: "Role",
    administrator: "Administrator",
    playtime: "Playtime",

    // Coordinates
    marker_position: "Marker Position",
    coordinates: "Coordinates",

    // Area selection
    clear_selection: "Clear Selection ({count})",

    // Map styles
    atlas: "Atlas",
    satellite: "Satellite",
    grid: "Grid",

    // Loading
    loading_map: "Loading map...",

    // Actions
    copy_coordinates: "Copy Coordinates",
    center_on_player: "Center on Player",
  },
  server_admins: {
    // Page header
    title: "Server Admins",
    description: "Manage admin permissions for your VexonAC server",
    dashboard: "Dashboard",
    admin_dashboard: "Admin Dashboard",

    // Access denied
    access_denied: "Access Denied",
    access_denied_description:
      'You don\'t have permission to manage admins for this server. Contact the server owner to get the "Manage Admins" permission.',

    // Actions
    add_admin: "Add Admin",
    edit_permissions: "Edit Permissions",
    remove_admin: "Remove Admin",
    protected: "Protected",

    // Add Admin Dialog
    add_new_admin: "Add New Admin",
    add_admin_description:
      "Search for a user and assign permissions to make them an admin.",
    select_user: "Select User",
    search_user_placeholder: "Search for a user...",
    search_user_detailed_placeholder:
      "Search by Discord ID, username, or name...",
    permissions_label: "Permissions",
    no_users_found: "No users found.",
    type_to_search: "Type to search for users...",
    searching: "Searching...",
    adding: "Adding...",
    add_admin_button: "Add Admin",
    cancel: "Cancel",

    // Edit Admin Dialog
    edit_admin_permissions: "Edit Admin Permissions",
    edit_admin_description: "Update permissions for {name} (@{username})",
    updating: "Updating...",
    update_permissions: "Update Permissions",

    // Delete Dialog
    remove_admin_title: "Remove Admin",
    remove_admin_description:
      "Are you sure you want to remove {name} (@{username}) as an admin? This action cannot be undone and they will lose all admin permissions.",
    removing: "Removing...",

    // Filters & Search
    filters_search: "Filters & Search",
    filters_search_description:
      "Search and filter admins by name, Discord ID, or permissions",
    search_placeholder: "Search by name, username, or Discord ID...",
    permissions_filter: "Permissions",

    // Table
    admin_column: "Admin",
    discord_id_column: "Discord ID",
    permissions_column: "Permissions",
    added_column: "Added",
    actions_column: "Actions",
    owner_badge: "Owner",

    // Permissions
    all_permissions: "All Permissions",
    all_permissions_description: "Full access to all server features",
    configuration: "Configuration",
    configuration_description: "Manage server configuration",
    download_files: "Download Files",
    download_files_description: "Download server files",
    manage_admins: "Manage Admins",
    manage_admins_description: "Add, edit, and remove admins",
    bypass: "Bypass",
    bypass_description: "Bypass anti-cheat detection",
    players_kick: "Kick Players",
    view_logs: "View Logs",
    view_logs_description: "View server logs",
    view_console: "View Console",
    view_console_description: "View server console",
    run_commands: "Run Commands",
    run_commands_description: "Run commands on the server console",
    players_kick_description: "Kick players from the server",
    manage_bans: "Manage Bans",
    manage_bans_description: "Manage server bans",
    unban_all: "Unban All",
    unban_all_description: "Unban all players from the server",
    players_lookup: "Players Lookup",
    players_lookup_description: "Lookup players on the server",
    more_permissions: "+{count} more",

    // Empty states
    no_admins_found: "No admins found",
    no_admins_description: "Try adjusting your search or filters",
    no_admins_description_empty: "Add your first admin to get started",

    // Pagination
    page_of_pages: "Page {page} of {total}",
    previous: "Previous",
    next: "Next",

    // Status messages
    admin_count: "{count} admin{plural} found",
    admin_added_success: "Admin added successfully",
    admin_updated_success: "Admin permissions updated successfully",
    admin_removed_success: "Admin removed successfully",
    admin_add_error: "Failed to add admin",
    admin_update_error: "Failed to update admin permissions",
    admin_remove_error: "Failed to remove admin",

    // Validation
    select_user_and_permissions:
      "Please select a user and at least one permission",
    select_at_least_one_permission: "Please select at least one permission",

    // Loading states
    loading: "Loading...",
  },
  server_players: {
    // Page header
    title: "Players",
    online_players: "Online Players",
    dashboard: "Dashboard",

    // Access denied
    access_denied: "Access Denied",
    access_denied_description:
      "You don't have permission to access this server's players. Contact the server owner to get added as a server member.",

    // Server offline
    server_offline: "Server Offline",
    server_offline_description:
      "This server is currently offline. Player data is only available when the server is online.",

    // Player statuses
    status: {
      on_foot: "On Foot",
      in_vehicle: "In Vehicle",
      swimming: "Swimming",
      armed: "Armed",
      dead: "Dead",
    },

    // Player badges
    admin: "Admin",
    new: "NEW",
    just_joined: "JUST JOINED",
    off: "OFF",

    // Time formats
    joined_time_ago: "Joined {hours}h {minutes}m ago",
    played_time: "played for {hours}h {minutes}m",
    time_online: "Time Online",

    // Health
    health: "Health",

    // Ping
    ping_ms: "{ping}ms",

    // Search and filters
    search_placeholder: "Search players by name or ID...",
    sort_filter: "Sort & Filter",
    sort_by: "Sort by",
    name: "Name",
    player_id: "Player ID",
    play_time: "Play Time",
    ping: "Ping",
    time_online_sort: "Time Online",
    ascending: "Ascending ✓",
    descending: "Descending ✓",

    // Threat score
    threat_score: "Threat Score",
    high_threat: "High Threat",
    medium_threat: "Medium Threat",
    low_threat: "Low Threat",
    minimal_threat: "Minimal Threat",
    show_potential_threats: "Show Potential Threats",

    // Filter by status
    filter_by_status: "Filter by Status",
    all_players: "All Players",
    dead: "Dead",
    armed: "Armed",
    in_vehicle: "In Vehicle",
    on_foot: "On Foot",

    // Player type filters
    show_new_players: "Show New Players (<1h playtime)",
    show_recently_joined: "Show Recently Joined (<30min online)",

    // Empty states
    no_players_found: "No Players Found",
    no_players_filters: "No players match your current filters.",
    no_players_online: "No players are currently online on this server.",

    // Pagination
    showing_results: "Showing {start} to {end} of {total} players",
    page_of: "Page {page} of {total}",
    previous_page: "Previous",
    next_page: "Next",

    // Player details modal
    player_details: "Player Details",
    player_details_description:
      "Detailed information and actions for this player",
    player_name: "Player Name",
    status_label: "Status",
    total_play_time: "Total Play Time",
    trust_score: "Threat Score",
    lookup_notice: "Need more detailed information about this player?",
    open_in_lookup: "Open in Player Lookup",

    // Actions
    kick_player: "Kick Player",
    ban_player: "Ban Player",
    screenshot: "Screenshot",
    watch_player: "Watch Player",
    watch_player_title: "Watch Player",
    watch_player_description: "Watch a player's current view",
    connecting_to_stream: "Connecting to stream...",
    stop_watching: "Stop Watching",

    // Ban modal
    ban_player_title: "Ban Player",
    ban_player_description: "This action will ban the player from the server",
    ban_reason: "Ban Reason",
    ban_reason_required: "Ban Reason *",
    ban_reason_placeholder: "Enter the reason for banning this player...",
    permanent_ban: "Permanent Ban",
    permanent_ban_description: "This ban will never expire automatically",
    temporary_ban_description:
      "This ban will expire after the specified duration",
    duration_hours: "Duration (hours)",
    banning: "Banning...",
    reason_required_error: "Please provide a reason for the ban",
    cancel_ban: "Cancel",

    // Kick modal
    kick_player_title: "Kick Player",
    kick_player_description:
      "This action will remove the player from the server temporarily",
    kick_reason: "Kick Reason (Optional)",
    kick_reason_placeholder: "Enter the reason for kicking this player...",
    kicking: "Kicking...",
    cancel_kick: "Cancel",

    // Screenshot modal
    screenshot_player_title: "Screenshot Player",
    screenshot_player_description:
      "This will capture a screenshot of the player's current view",
    screenshot_notice:
      "A screenshot request will be sent to the player's client. The screenshot will be saved in your server's Discord configured channel.",
    take_screenshot: "Take Screenshot",
    screenshot_title: "Screenshot",
    screenshot_description: "Player screenshot captured from their client",
    capturing_screenshot: "Capturing screenshot from player's client...",
    screenshot_wait_notice:
      "This may take a few seconds depending on the player's connection",
    screenshot_captured: "Screenshot captured successfully",
    open_in_new_tab: "Open in New Tab",
    cancel_screenshot: "Cancel",

    // Screenshot failure
    screenshot_failed: "Failed to capture screenshot",
    screenshot_failed_description:
      "The screenshot request failed or timed out. This could be due to:",
    screenshot_error_1: "Player is not responding to screenshot requests",
    screenshot_error_2: "Network connectivity issues",
    screenshot_error_3: "Player's client doesn't support screenshots",

    // Spectate
    spectate_notice: "Spectate functionality will be implemented",

    // Loading states
    loading_players: "Loading...",
  },
  server_multistream: {
    // Page title
    title: "Multi Stream",

    // Access denied
    access_denied: "Access Denied",
    access_denied_description:
      "You don't have permission to access this server's multi-stream. Contact the server owner to get added as a server member.",

    // Server offline
    server_offline: "Server Offline",
    server_offline_description:
      "This server is currently offline. Multi-stream is only available when the server is online.",

    // Sidebar header
    players: "Players",

    // Search and controls
    search_placeholder: "Search by name or ID...",
    sort_field_name: "Name",
    sort_field_playtime: "Play Time",
    sort_field_threat_score: "Threat Score",
    sort_field_join_time: "Join Time",
    select_all: "All",
    select_none: "None",

    // Filters
    filters: "Filters",
    recently_joined: "Recently joined",
    new_players: "New players",
    potential_threats: "Potential threats",
    admins: "Admins",

    // Player badges and status
    admin: "Admin",
    just_joined: "Just Joined",
    low_playtime: "Low Playtime",
    threat_score_tooltip:
      "Indicates the player's threat score, based on historical data across all servers and more.",
    admin_tooltip: "Server administrator with elevated privileges",
    just_joined_tooltip: "Player joined the server less than 30 minutes ago",
    low_playtime_tooltip: "Player has less than 1 hour of total playtime",

    // Ping status
    ping_off: "OFF",

    // Empty states
    no_players_match_filters: "No Players Match Filters",
    no_players_match_filters_description:
      "Try adjusting your search or filter settings to see players",
    no_players_selected: "No Players Selected",
    no_players_selected_description:
      "Select players from the sidebar to start streaming",
    scroll_to_load_stream: "Scroll to load stream",

    // Stream quality indicators
    stream_quality: "Quality",
    stream_latency: "Latency",

    // Loading states
    loading: "Loading...",
    connecting_to_stream: "Connecting to stream...",
  },
  landing: {
    // Navigation
    nav: {
      home: "Home",
      features: "Features",
      pricing: "Pricing",
      faqs: "FAQs",
      signin: "Signin",
      panel: "Panel",
    },

    // Hero Section
    hero: {
      badge: "New: Major Update Just Dropped!",
      title: "Protect Your FiveM Server in 5 minutes with",
      subtitle:
        "The ultimate anti-cheat and player intelligence solution. Track, analyze, and monitor your players — all in one place.",
      get_started: "Get Started",
      try_demo: "Try Demo",
      dashboard_alt: "VexonAC Dashboard",
    },

    // Features Section
    features: {
      title: "Powerful Features for Next-Level Protection",
      subtitle:
        "From real-time monitoring to AI-powered detection, see how our features deliver unmatched protection for your server.",
      list: {
        web_panel: {
          title: "Live Web Panel",
          description:
            "Monitor every player live with our interactive map and multi-stream view. See detailed player info, trigger live bans, and manage your server from one sleek, real-time dashboard.",
        },
        network_intelligence: {
          title: "Network Intelligence",
          description:
            "VexonAC analyzes player behavior across our entire ecosystem — identifying suspicious patterns and known cheaters before they even join your server.",
        },
        plug_play: {
          title: "Plug & Play Installation",
          description:
            "VexonAC works instantly with all your scripts. Thanks to AI-assisted configuration, there's no setup hassle — just drag, drop, and dominate.",
        },
        anti_aimbot: {
          title: "Anti-Aimbot",
          description:
            "Our cutting-edge algorithm detects even the most subtle aimbot usage — including high smooth and randomized targets — without false positives.",
        },
        event_protection: {
          title: "Event Protection",
          description:
            "Automatically secures and encrypts all client & server events — obfuscating names and payloads to block exploiters before they even start.",
        },
        advanced_detections: {
          title: "Advanced Detections",
          description:
            "VexonAC delivers industry-leading cheat detection with zero false bans. From player exploits to complex injections, your entire server is covered — and thanks to daily updates, you're always ahead of new threats.",
        },
      },
    },

    // Pricing Section
    pricing: {
      title: "Simple, Honest Pricing",
      subtitle:
        "No hidden fees. No upsells. Lock in early pricing before we launch — all plans include every detection module.",
      popular_badge: "★ Best Value",
      features: {
        instant_delivery: "Instant license delivery",
        all_features: "All Detection Modules",
        web_panel: "Live web panel",
        support: "Community support",
      },
      plans: {
        monthly: {
          name: "Starter",
          price: "$12",
          period: "month",
          feature_1: "1 Month Full Access",
        },
        quarterly: {
          name: "Standard",
          price: "$29",
          period: "3 months",
          feature_1: "3 Months Full Access",
        },
        lifetime: {
          name: "Lifetime",
          price: "$89",
          period: "forever",
          feature_1: "Lifetime Full Access",
        },
      },
      premium: {
        name: "Lifetime",
        price: "$89",
        period: "forever",
        description: "Pay once, protected forever",
        perfect_for: "Best for established servers",
        expert_setup: "All features included",
        features: {
          installation: "Lifetime access to all updates",
          optimization: "Free setup assistance",
          updates: "All future detection modules",
          premium_features: "Priority support channel",
          discount: "Lock in today's price forever",
          support: "Discord community access",
        },
      },
      purchase: "Purchase on Discord",
      email_notice: "Your email is only used to send your license key",
      discount: {
        label: "Discount Code",
        optional: "optional",
        placeholder: "Enter discount code",
        applied: "Discount applied",
        off: "off",
        original_price: "Original Price",
        discount: "Discount",
        final_price: "Final Price",
        invalid: "Invalid or expired discount code",
      },
      terms: {
        accept: "I accept the",
        terms: "Terms of Service",
        and: "and",
        privacy: "Privacy Policy",
      },
    },

    // FAQ Section
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Got questions? We've got answers.",
      questions: {
        how_prevents: {
          question: "How does VexonAC prevents cheating?",
          answer:
            "VexonAC uses smart detection to spot cheats, hacks, and suspicious behavior in real time and alerts you immediately.",
        },
        what_detections: {
          question: "What types of cheats are detected by VexonAC?",
          answer:
            "VexonAC covers your entire server with all types of cheats, exploits, injections, and more. We're always ahead of new threats and constantly update VexonAC to provide you with the best protection.",
        },
        slow_server: {
          question: "Will VexonAC slow down my server?",
          answer:
            "No. It runs quietly in the background without causing lag or affecting honest players.",
        },
        free_trial: {
          question: "Does VexonAC offer a free trial?",
          answer:
            "Yes, you can explore our panel via an interactive demo. Free short trials are also available on request via our Discord, subject to certain conditions.",
        },
        easy_install: {
          question: "Is VexonAC easy to install?",
          answer:
            "Yes! Follow our simple setup guide and you can be fully protected in under 5 minutes. The configuration is automatic and you can start using VexonAC immediately. Support is ready to help if needed.",
        },
        bypass: {
          question: "Can cheaters get around VexonAC?",
          answer:
            "We update VexonAC constantly to catch new cheats. While no system is perfect, ours is by far the best at stopping cheaters.",
        },
        works_scripts: {
          question: "Does VexonAC work with my scripts?",
          answer:
            "Absolutely. It works smoothly with your existing scripts without breaking anything.",
        },
        after_buying: {
          question: "What do I do after buying?",
          answer:
            "After purchase, claim your license in our online panel using the email we send. Then download and start protecting your server.",
        },
        multiple_servers: {
          question: "Can I use VexonAC on multiple servers?",
          answer:
            "One license works for one server, you will need to buy a new license for each server you want to protect. But you can switch the license to a different server IP anytime, like for development.",
        },
      },
    },

    // Need Help Section
    need_help: {
      title: "Need Help?",
      subtitle:
        "Join our community for support, updates, and discussions with other server owners.",
      join_discord: "Join Discord",
      get_started: "Get Started NOW",
      stats: {
        experience: {
          label: "Years Experience",
        },
        servers: {
          label: "Servers Protected",
        },
        bans: {
          label: "Bans Issued",
        },
      },
    },

    // Footer Section
    footer: {
      description:
        "FiveM anticheat with real-time cheat detection, automated bans, and a powerful management panel — trusted by 10 FiveM servers.",
      navigation: {
        title: "Navigation",
        home: "Home",
        features: "Features",
        pricing: "Pricing",
        faqs: "FAQs",
      },
      legal: {
        title: "Legal",
        terms: "Terms of Service",
        privacy: "Privacy Policy",
        refund: "Refund Policy",
      },
      support: {
        title: "Support",
        discord: "Discord Support",
        documentation: "Documentation",
      },
      status: "System Status",
      copyright: "Â© Copyright {year}, All Rights Reserved by VexonAC",
    },
  },
  api_keys: {
    title: "API Keys",
    description: "Manage your API keys to access our APIs, the largest database of FiveM players and cheaters.",
    dashboard: "Dashboard",
    create_api_key: "Create API Key",
    name_label: "Key Name",
    plan_label: "Plan",
    permissions_label: "Permissions",
    permissions_all: "All Permissions",
    permissions_read_only: "Read Only",
    permissions_restricted: "Restricted",
    cancel: "Cancel",
    create: "Create",
    created_at: "Created",
    last_used: "Last Used",
    usage: "Usage",
    status: "Status",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    copy: "Copy",
    secret_key_warning: "Save this secret key somewhere safe. You won't be able to see it again!",
    secret_key_label: "Secret Key",
    access_key_label: "Access Key",
    close: "Close",
    no_keys_found: "No API keys found",
    delete_confirm_title: "Delete API Key",
    delete_confirm_description: "Are you sure you want to delete this API key? This action cannot be undone.",
    confirm_delete: "Delete",
    active: "Active",
    suspended: "Suspended",
    expired: "Expired",
    cancelled: "Cancelled",
    monthly_requests: "Monthly Requests",
    requests: "requests",
    select_plan: "Select a Plan",
    linked_server: "Linked Server",
    server_label: "Server",
    select_server: "Select a server (optional)",
    no_server: "No server linked",
    unlink_server: "Unlink Server",
  },
} as const;

