import SwiftUI

struct DashboardView: View {
    @State private var upcomingClasses = [
        UpcomingClass(id: 1, name: "Soccer Training", time: "2:00 PM", sport: "Soccer", coach: "Coach Sarah"),
        UpcomingClass(id: 2, name: "Basketball Drills", time: "4:00 PM", sport: "Basketball", coach: "Coach Mike"),
        UpcomingClass(id: 3, name: "Tennis Lessons", time: "6:00 PM", sport: "Tennis", coach: "Coach Lisa")
    ]
    
    @State private var recentBookings = [
        RecentBooking(id: 1, className: "Rugby Training", date: "Today", status: "Confirmed"),
        RecentBooking(id: 2, className: "Swimming Lessons", date: "Yesterday", status: "Completed"),
        RecentBooking(id: 3, className: "Cricket Practice", date: "2 days ago", status: "Completed")
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: IHAcademyTheme.largePadding) {
                    // Header
                    headerSection
                    
                    // Stats Cards
                    statsSection
                    
                    // Upcoming Classes
                    upcomingClassesSection
                    
                    // Recent Bookings
                    recentBookingsSection
                    
                    // Quick Actions
                    quickActionsSection
                }
                .padding(.horizontal, IHAcademyTheme.mediumPadding)
                .padding(.bottom, IHAcademyTheme.largePadding)
            }
            .background(IHAcademyTheme.backgroundColor)
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: IHAcademyTheme.mediumPadding) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Welcome back!")
                        .font(IHAcademyTheme.headlineFont)
                        .foregroundColor(IHAcademyTheme.textPrimary)
                    
                    Text("Ready for your training session?")
                        .font(IHAcademyTheme.bodyFont)
                        .foregroundColor(IHAcademyTheme.textSecondary)
                }
                
                Spacer()
                
                // Profile Avatar
                Circle()
                    .fill(IHAcademyTheme.primaryGradient)
                    .frame(width: 50, height: 50)
                    .overlay(
                        Image(systemName: "person.fill")
                            .foregroundColor(.white)
                            .font(.title3)
                    )
            }
        }
        .padding(IHAcademyTheme.largePadding)
        .ihCardStyle()
    }
    
    private var statsSection: some View {
        HStack(spacing: IHAcademyTheme.mediumPadding) {
            StatCard(title: "Classes", value: "12", subtitle: "This month", color: IHAcademyTheme.primaryColor)
            StatCard(title: "Hours", value: "24", subtitle: "Trained", color: IHAcademyTheme.secondaryColor)
            StatCard(title: "Progress", value: "85%", subtitle: "Complete", color: IHAcademyTheme.accentColor)
        }
    }
    
    private var upcomingClassesSection: some View {
        VStack(alignment: .leading, spacing: IHAcademyTheme.mediumPadding) {
            HStack {
                Text("Today's Classes")
                    .font(IHAcademyTheme.headlineFont)
                    .foregroundColor(IHAcademyTheme.textPrimary)
                
                Spacer()
                
                Button("View All") {
                    // Navigate to classes
                }
                .font(IHAcademyTheme.captionFont)
                .foregroundColor(IHAcademyTheme.secondaryColor)
            }
            
            LazyVStack(spacing: IHAcademyTheme.smallPadding) {
                ForEach(upcomingClasses) { class_ in
                    UpcomingClassCard(upcomingClass: class_)
                }
            }
        }
        .padding(IHAcademyTheme.largePadding)
        .ihCardStyle()
    }
    
    private var recentBookingsSection: some View {
        VStack(alignment: .leading, spacing: IHAcademyTheme.mediumPadding) {
            Text("Recent Bookings")
                .font(IHAcademyTheme.headlineFont)
                .foregroundColor(IHAcademyTheme.textPrimary)
            
            LazyVStack(spacing: IHAcademyTheme.smallPadding) {
                ForEach(recentBookings) { booking in
                    RecentBookingCard(booking: booking)
                }
            }
        }
        .padding(IHAcademyTheme.largePadding)
        .ihCardStyle()
    }
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: IHAcademyTheme.mediumPadding) {
            Text("Quick Actions")
                .font(IHAcademyTheme.headlineFont)
                .foregroundColor(IHAcademyTheme.textPrimary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: IHAcademyTheme.mediumPadding) {
                QuickActionCard(
                    title: "Book Class",
                    icon: "calendar.badge.plus",
                    color: IHAcademyTheme.primaryColor
                ) {
                    // Navigate to booking
                }
                
                QuickActionCard(
                    title: "View Schedule",
                    icon: "calendar",
                    color: IHAcademyTheme.secondaryColor
                ) {
                    // Navigate to schedule
                }
                
                QuickActionCard(
                    title: "Messages",
                    icon: "message.fill",
                    color: IHAcademyTheme.accentColor
                ) {
                    // Navigate to messages
                }
                
                QuickActionCard(
                    title: "Settings",
                    icon: "gear",
                    color: IHAcademyTheme.textSecondary
                ) {
                    // Navigate to settings
                }
            }
        }
        .padding(IHAcademyTheme.largePadding)
        .ihCardStyle()
    }
}

// MARK: - Supporting Views
struct StatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(value)
                .font(IHAcademyTheme.titleFont)
                .foregroundColor(color)
            
            Text(title)
                .font(IHAcademyTheme.captionFont)
                .foregroundColor(IHAcademyTheme.textPrimary)
            
            Text(subtitle)
                .font(.caption)
                .foregroundColor(IHAcademyTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(IHAcademyTheme.mediumPadding)
        .ihCardStyle()
    }
}

struct UpcomingClassCard: View {
    let upcomingClass: UpcomingClass
    
    var body: some View {
        HStack(spacing: IHAcademyTheme.mediumPadding) {
            // Sport Icon
            Circle()
                .fill(IHAcademyTheme.secondaryColor.opacity(0.1))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: "sportscourt.fill")
                        .foregroundColor(IHAcademyTheme.secondaryColor)
                        .font(.title3)
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text(upcomingClass.name)
                    .font(IHAcademyTheme.bodyFont)
                    .foregroundColor(IHAcademyTheme.textPrimary)
                
                Text(upcomingClass.coach)
                    .font(IHAcademyTheme.captionFont)
                    .foregroundColor(IHAcademyTheme.textSecondary)
            }
            
            Spacer()
            
            Text(upcomingClass.time)
                .font(IHAcademyTheme.captionFont)
                .foregroundColor(IHAcademyTheme.primaryColor)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(IHAcademyTheme.primaryColor.opacity(0.1))
                .cornerRadius(8)
        }
        .padding(IHAcademyTheme.mediumPadding)
        .background(IHAcademyTheme.surfaceColor)
        .cornerRadius(IHAcademyTheme.cornerRadius)
        .overlay(
            RoundedRectangle(cornerRadius: IHAcademyTheme.cornerRadius)
                .stroke(IHAcademyTheme.borderColor, lineWidth: 1)
        )
    }
}

struct RecentBookingCard: View {
    let booking: RecentBooking
    
    var body: some View {
        HStack(spacing: IHAcademyTheme.mediumPadding) {
            VStack(alignment: .leading, spacing: 4) {
                Text(booking.className)
                    .font(IHAcademyTheme.bodyFont)
                    .foregroundColor(IHAcademyTheme.textPrimary)
                
                Text(booking.date)
                    .font(IHAcademyTheme.captionFont)
                    .foregroundColor(IHAcademyTheme.textSecondary)
            }
            
            Spacer()
            
            Text(booking.status)
                .font(.caption)
                .foregroundColor(statusColor(for: booking.status))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(statusColor(for: booking.status).opacity(0.1))
                .cornerRadius(6)
        }
        .padding(IHAcademyTheme.mediumPadding)
        .background(IHAcademyTheme.surfaceColor)
        .cornerRadius(IHAcademyTheme.cornerRadius)
        .overlay(
            RoundedRectangle(cornerRadius: IHAcademyTheme.cornerRadius)
                .stroke(IHAcademyTheme.borderColor, lineWidth: 1)
        )
    }
    
    private func statusColor(for status: String) -> Color {
        switch status.lowercased() {
        case "confirmed":
            return IHAcademyTheme.successColor
        case "completed":
            return IHAcademyTheme.secondaryColor
        case "pending":
            return IHAcademyTheme.warningColor
        case "cancelled":
            return IHAcademyTheme.errorColor
        default:
            return IHAcademyTheme.textSecondary
        }
    }
}

struct QuickActionCard: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: IHAcademyTheme.smallPadding) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Text(title)
                    .font(IHAcademyTheme.captionFont)
                    .foregroundColor(IHAcademyTheme.textPrimary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(IHAcademyTheme.mediumPadding)
            .background(IHAcademyTheme.surfaceColor)
            .cornerRadius(IHAcademyTheme.cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: IHAcademyTheme.cornerRadius)
                    .stroke(color.opacity(0.2), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Data Models
struct UpcomingClass: Identifiable {
    let id: Int
    let name: String
    let time: String
    let sport: String
    let coach: String
}

struct RecentBooking: Identifiable {
    let id: Int
    let className: String
    let date: String
    let status: String
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
    }
}