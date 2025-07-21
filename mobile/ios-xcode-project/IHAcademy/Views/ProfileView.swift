import SwiftUI

struct ProfileView: View {
    @State private var showingSettings = false
    @State private var showingEditProfile = false
    @State private var user = sampleUser
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: IHAcademyTheme.largePadding) {
                    // Profile Header
                    profileHeader
                    
                    // Stats Section
                    statsSection
                    
                    // Menu Options
                    menuSection
                    
                    // Account Actions
                    accountSection
                }
                .padding(.horizontal, IHAcademyTheme.mediumPadding)
                .padding(.bottom, IHAcademyTheme.largePadding)
            }
            .background(IHAcademyTheme.backgroundColor)
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Settings") {
                        showingSettings = true
                    }
                    .foregroundColor(IHAcademyTheme.primaryColor)
                }
            }
        }
        .sheet(isPresented: $showingSettings) {
            SettingsView()
        }
        .sheet(isPresented: $showingEditProfile) {
            EditProfileView(user: $user)
        }
    }
    
    private var profileHeader: some View {
        VStack(spacing: IHAcademyTheme.mediumPadding) {
            // Profile Image
            Circle()
                .fill(IHAcademyTheme.primaryGradient)
                .frame(width: 120, height: 120)
                .overlay(
                    Text(user.initials)
                        .font(.system(size: 48, weight: .semibold))
                        .foregroundColor(.white)
                )
            
            // User Info
            VStack(spacing: 8) {
                Text(user.name)
                    .font(IHAcademyTheme.titleFont)
                    .foregroundColor(IHAcademyTheme.textPrimary)
                
                Text(user.email)
                    .font(IHAcademyTheme.bodyFont)
                    .foregroundColor(IHAcademyTheme.textSecondary)
                
                if !user.phone.isEmpty {
                    Text(user.phone)
                        .font(IHAcademyTheme.bodyFont)
                        .foregroundColor(IHAcademyTheme.textSecondary)
                }
                
                // Membership Badge
                Text(user.membershipType)
                    .font(IHAcademyTheme.captionFont)
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .background(membershipColor)
                    .cornerRadius(12)
            }
            
            // Edit Profile Button
            Button("Edit Profile") {
                showingEditProfile = true
            }
            .buttonStyle(IHSecondaryButtonStyle())
        }
        .padding(IHAcademyTheme.largePadding)
        .ihCardStyle()
    }
    
    private var statsSection: some View {
        HStack(spacing: IHAcademyTheme.mediumPadding) {
            ProfileStatCard(title: "Classes\nBooked", value: "\(user.classesBooked)", color: IHAcademyTheme.primaryColor)
            ProfileStatCard(title: "Hours\nTrained", value: "\(user.hoursTrained)", color: IHAcademyTheme.secondaryColor)
            ProfileStatCard(title: "Achievements", value: "\(user.achievements)", color: IHAcademyTheme.accentColor)
        }
    }
    
    private var menuSection: some View {
        VStack(spacing: 0) {
            ProfileMenuRow(icon: "calendar.badge.plus", title: "My Bookings", subtitle: "View and manage bookings") {
                // Navigate to bookings
            }
            
            Divider().padding(.leading, 60)
            
            ProfileMenuRow(icon: "heart.fill", title: "Favorite Classes", subtitle: "Your saved classes") {
                // Navigate to favorites
            }
            
            Divider().padding(.leading, 60)
            
            ProfileMenuRow(icon: "trophy.fill", title: "Achievements", subtitle: "Your training milestones") {
                // Navigate to achievements
            }
            
            Divider().padding(.leading, 60)
            
            ProfileMenuRow(icon: "creditcard.fill", title: "Payment Methods", subtitle: "Manage payment options") {
                // Navigate to payments
            }
            
            Divider().padding(.leading, 60)
            
            ProfileMenuRow(icon: "bell.fill", title: "Notifications", subtitle: "Manage notifications") {
                showingSettings = true
            }
        }
        .ihCardStyle()
    }
    
    private var accountSection: some View {
        VStack(spacing: 0) {
            ProfileMenuRow(icon: "questionmark.circle.fill", title: "Help & Support", subtitle: "Get help and contact support") {
                // Open help
            }
            
            Divider().padding(.leading, 60)
            
            ProfileMenuRow(icon: "doc.text.fill", title: "Terms & Privacy", subtitle: "Legal information") {
                // Open terms
            }
            
            Divider().padding(.leading, 60)
            
            ProfileMenuRow(icon: "arrow.right.square.fill", title: "Sign Out", subtitle: "Sign out of your account", isDestructive: true) {
                // Handle sign out
            }
        }
        .ihCardStyle()
    }
    
    private var membershipColor: Color {
        switch user.membershipType.lowercased() {
        case "premium":
            return Color.purple
        case "basic":
            return IHAcademyTheme.secondaryColor
        case "free":
            return IHAcademyTheme.textSecondary
        default:
            return IHAcademyTheme.primaryColor
        }
    }
}

// MARK: - Supporting Views
struct ProfileStatCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(value)
                .font(IHAcademyTheme.titleFont)
                .foregroundColor(color)
            
            Text(title)
                .font(IHAcademyTheme.captionFont)
                .foregroundColor(IHAcademyTheme.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(IHAcademyTheme.mediumPadding)
        .ihCardStyle()
    }
}

struct ProfileMenuRow: View {
    let icon: String
    let title: String
    let subtitle: String
    var isDestructive: Bool = false
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: IHAcademyTheme.mediumPadding) {
                // Icon
                Circle()
                    .fill(isDestructive ? IHAcademyTheme.errorColor.opacity(0.1) : IHAcademyTheme.secondaryColor.opacity(0.1))
                    .frame(width: 44, height: 44)
                    .overlay(
                        Image(systemName: icon)
                            .foregroundColor(isDestructive ? IHAcademyTheme.errorColor : IHAcademyTheme.secondaryColor)
                            .font(.title3)
                    )
                
                // Content
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(IHAcademyTheme.bodyFont)
                        .foregroundColor(isDestructive ? IHAcademyTheme.errorColor : IHAcademyTheme.textPrimary)
                    
                    Text(subtitle)
                        .font(IHAcademyTheme.captionFont)
                        .foregroundColor(IHAcademyTheme.textSecondary)
                }
                
                Spacer()
                
                // Chevron
                Image(systemName: "chevron.right")
                    .foregroundColor(IHAcademyTheme.textSecondary)
                    .font(.caption)
            }
            .padding(IHAcademyTheme.mediumPadding)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var notificationsEnabled = true
    @State private var emailNotifications = true
    @State private var pushNotifications = true
    @State private var classReminders = true
    
    var body: some View {
        NavigationView {
            VStack(spacing: IHAcademyTheme.largePadding) {
                // Notifications Section
                VStack(alignment: .leading, spacing: IHAcademyTheme.mediumPadding) {
                    Text("Notifications")
                        .font(IHAcademyTheme.headlineFont)
                        .foregroundColor(IHAcademyTheme.textPrimary)
                    
                    VStack(spacing: 0) {
                        SettingsToggleRow(title: "All Notifications", subtitle: "Enable or disable all notifications", isOn: $notificationsEnabled)
                        
                        Divider().padding(.leading, IHAcademyTheme.mediumPadding)
                        
                        SettingsToggleRow(title: "Email Notifications", subtitle: "Receive notifications via email", isOn: $emailNotifications)
                            .disabled(!notificationsEnabled)
                        
                        Divider().padding(.leading, IHAcademyTheme.mediumPadding)
                        
                        SettingsToggleRow(title: "Push Notifications", subtitle: "Receive push notifications", isOn: $pushNotifications)
                            .disabled(!notificationsEnabled)
                        
                        Divider().padding(.leading, IHAcademyTheme.mediumPadding)
                        
                        SettingsToggleRow(title: "Class Reminders", subtitle: "Get reminded before classes", isOn: $classReminders)
                            .disabled(!notificationsEnabled)
                    }
                    .ihCardStyle()
                }
                
                Spacer()
            }
            .padding(.horizontal, IHAcademyTheme.mediumPadding)
            .background(IHAcademyTheme.backgroundColor)
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct SettingsToggleRow: View {
    let title: String
    let subtitle: String
    @Binding var isOn: Bool
    
    var body: some View {
        HStack(spacing: IHAcademyTheme.mediumPadding) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(IHAcademyTheme.bodyFont)
                    .foregroundColor(IHAcademyTheme.textPrimary)
                
                Text(subtitle)
                    .font(IHAcademyTheme.captionFont)
                    .foregroundColor(IHAcademyTheme.textSecondary)
            }
            
            Spacer()
            
            Toggle("", isOn: $isOn)
                .tint(IHAcademyTheme.primaryColor)
        }
        .padding(IHAcademyTheme.mediumPadding)
    }
}

struct EditProfileView: View {
    @Binding var user: User
    @Environment(\.dismiss) private var dismiss
    @State private var editedUser: User
    
    init(user: Binding<User>) {
        self._user = user
        self._editedUser = State(initialValue: user.wrappedValue)
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: IHAcademyTheme.largePadding) {
                    // Profile Image
                    Circle()
                        .fill(IHAcademyTheme.primaryGradient)
                        .frame(width: 120, height: 120)
                        .overlay(
                            Text(editedUser.initials)
                                .font(.system(size: 48, weight: .semibold))
                                .foregroundColor(.white)
                        )
                    
                    Button("Change Photo") {
                        // Handle photo change
                    }
                    .font(IHAcademyTheme.captionFont)
                    .foregroundColor(IHAcademyTheme.secondaryColor)
                    
                    // Form Fields
                    VStack(spacing: IHAcademyTheme.mediumPadding) {
                        ProfileFormField(title: "Name", text: $editedUser.name)
                        ProfileFormField(title: "Email", text: $editedUser.email)
                        ProfileFormField(title: "Phone", text: $editedUser.phone)
                    }
                    .ihCardStyle()
                    .padding(.horizontal, IHAcademyTheme.mediumPadding)
                    
                    // Save Button
                    Button("Save Changes") {
                        user = editedUser
                        dismiss()
                    }
                    .buttonStyle(IHPrimaryButtonStyle())
                    .padding(.horizontal, IHAcademyTheme.mediumPadding)
                }
                .padding(.vertical, IHAcademyTheme.largePadding)
            }
            .background(IHAcademyTheme.backgroundColor)
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct ProfileFormField: View {
    let title: String
    @Binding var text: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(IHAcademyTheme.captionFont)
                .foregroundColor(IHAcademyTheme.textPrimary)
            
            TextField("Enter \(title.lowercased())", text: $text)
                .textFieldStyle(IHTextFieldStyle())
        }
        .padding(.horizontal, IHAcademyTheme.mediumPadding)
    }
}

// MARK: - Data Models
struct User: Identifiable {
    let id: Int
    var name: String
    var email: String
    var phone: String
    let membershipType: String
    let classesBooked: Int
    let hoursTrained: Int
    let achievements: Int
    
    var initials: String {
        let components = name.components(separatedBy: " ")
        return components.compactMap { $0.first }.map { String($0) }.joined()
    }
}

// MARK: - Sample Data
let sampleUser = User(
    id: 1,
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+27 12 345 6789",
    membershipType: "Premium",
    classesBooked: 24,
    hoursTrained: 48,
    achievements: 7
)

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
    }
}