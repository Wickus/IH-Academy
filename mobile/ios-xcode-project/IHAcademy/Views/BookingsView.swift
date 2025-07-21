import SwiftUI

struct BookingsView: View {
    @State private var selectedTab = 0
    @State private var bookings = sampleBookings
    @State private var showingCancelAlert = false
    @State private var bookingToCancel: Booking?
    
    var upcomingBookings: [Booking] {
        bookings.filter { $0.status == "Confirmed" || $0.status == "Pending" }
    }
    
    var pastBookings: [Booking] {
        bookings.filter { $0.status == "Completed" || $0.status == "Cancelled" }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Picker
                Picker("Bookings", selection: $selectedTab) {
                    Text("Upcoming").tag(0)
                    Text("Past").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal, IHAcademyTheme.mediumPadding)
                .padding(.vertical, IHAcademyTheme.smallPadding)
                
                // Content
                TabView(selection: $selectedTab) {
                    // Upcoming Bookings
                    BookingsList(
                        bookings: upcomingBookings,
                        isUpcoming: true,
                        onCancel: { booking in
                            bookingToCancel = booking
                            showingCancelAlert = true
                        }
                    )
                    .tag(0)
                    
                    // Past Bookings
                    BookingsList(
                        bookings: pastBookings,
                        isUpcoming: false,
                        onCancel: { _ in }
                    )
                    .tag(1)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            }
            .background(IHAcademyTheme.backgroundColor)
            .navigationTitle("My Bookings")
            .navigationBarTitleDisplayMode(.large)
        }
        .alert("Cancel Booking", isPresented: $showingCancelAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Confirm", role: .destructive) {
                if let booking = bookingToCancel {
                    cancelBooking(booking)
                }
            }
        } message: {
            Text("Are you sure you want to cancel this booking? This action cannot be undone.")
        }
    }
    
    private func cancelBooking(_ booking: Booking) {
        if let index = bookings.firstIndex(where: { $0.id == booking.id }) {
            bookings[index].status = "Cancelled"
        }
        bookingToCancel = nil
    }
}

// MARK: - Supporting Views
struct BookingsList: View {
    let bookings: [Booking]
    let isUpcoming: Bool
    let onCancel: (Booking) -> Void
    
    var body: some View {
        if bookings.isEmpty {
            EmptyBookingsView(isUpcoming: isUpcoming)
        } else {
            ScrollView {
                LazyVStack(spacing: IHAcademyTheme.mediumPadding) {
                    ForEach(bookings) { booking in
                        BookingCard(
                            booking: booking,
                            isUpcoming: isUpcoming,
                            onCancel: { onCancel(booking) }
                        )
                    }
                }
                .padding(.horizontal, IHAcademyTheme.mediumPadding)
                .padding(.vertical, IHAcademyTheme.mediumPadding)
            }
        }
    }
}

struct BookingCard: View {
    let booking: Booking
    let isUpcoming: Bool
    let onCancel: () -> Void
    
    var body: some View {
        VStack(spacing: IHAcademyTheme.mediumPadding) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(booking.className)
                        .font(IHAcademyTheme.headlineFont)
                        .foregroundColor(IHAcademyTheme.textPrimary)
                    
                    Text(booking.sport)
                        .font(IHAcademyTheme.captionFont)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(sportColor(for: booking.sport))
                        .cornerRadius(6)
                }
                
                Spacer()
                
                StatusBadge(status: booking.status)
            }
            
            // Details
            VStack(spacing: IHAcademyTheme.smallPadding) {
                BookingDetailRow(icon: "person.fill", text: booking.coach)
                BookingDetailRow(icon: "calendar", text: "\(booking.date) at \(booking.time)")
                BookingDetailRow(icon: "mappin.and.ellipse", text: booking.location)
                BookingDetailRow(icon: "creditcard.fill", text: "R\(booking.price, specifier: "%.0f")")
            }
            
            // Actions
            if isUpcoming && (booking.status == "Confirmed" || booking.status == "Pending") {
                HStack(spacing: IHAcademyTheme.mediumPadding) {
                    Button("View Details") {
                        // Handle view details
                    }
                    .buttonStyle(IHSecondaryButtonStyle())
                    
                    Button("Cancel") {
                        onCancel()
                    }
                    .buttonStyle(CancelButtonStyle())
                }
            } else if booking.status == "Completed" {
                Button("Book Again") {
                    // Handle book again
                }
                .buttonStyle(IHPrimaryButtonStyle())
            }
        }
        .padding(IHAcademyTheme.largePadding)
        .ihCardStyle()
    }
    
    private func sportColor(for sport: String) -> Color {
        switch sport.lowercased() {
        case "soccer":
            return Color.green
        case "basketball":
            return Color.orange
        case "tennis":
            return Color.blue
        case "rugby":
            return Color.red
        case "swimming":
            return Color.cyan
        case "cricket":
            return Color.brown
        default:
            return IHAcademyTheme.secondaryColor
        }
    }
}

struct BookingDetailRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: IHAcademyTheme.smallPadding) {
            Image(systemName: icon)
                .foregroundColor(IHAcademyTheme.secondaryColor)
                .frame(width: 16)
            
            Text(text)
                .font(IHAcademyTheme.bodyFont)
                .foregroundColor(IHAcademyTheme.textSecondary)
            
            Spacer()
        }
    }
}

struct StatusBadge: View {
    let status: String
    
    var body: some View {
        Text(status)
            .font(.caption)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor)
            .cornerRadius(6)
    }
    
    private var statusColor: Color {
        switch status.lowercased() {
        case "confirmed":
            return IHAcademyTheme.successColor
        case "pending":
            return IHAcademyTheme.warningColor
        case "completed":
            return IHAcademyTheme.secondaryColor
        case "cancelled":
            return IHAcademyTheme.errorColor
        default:
            return IHAcademyTheme.textSecondary
        }
    }
}

struct EmptyBookingsView: View {
    let isUpcoming: Bool
    
    var body: some View {
        VStack(spacing: IHAcademyTheme.largePadding) {
            Image(systemName: isUpcoming ? "calendar.badge.plus" : "calendar.badge.checkmark")
                .font(.system(size: 80))
                .foregroundColor(IHAcademyTheme.textSecondary.opacity(0.5))
            
            VStack(spacing: IHAcademyTheme.smallPadding) {
                Text(isUpcoming ? "No Upcoming Bookings" : "No Past Bookings")
                    .font(IHAcademyTheme.headlineFont)
                    .foregroundColor(IHAcademyTheme.textPrimary)
                
                Text(isUpcoming ? 
                     "Book your first class to get started with your training journey" :
                     "Your completed and cancelled bookings will appear here"
                )
                .font(IHAcademyTheme.bodyFont)
                .foregroundColor(IHAcademyTheme.textSecondary)
                .multilineTextAlignment(.center)
            }
            
            if isUpcoming {
                Button("Browse Classes") {
                    // Navigate to classes
                }
                .buttonStyle(IHPrimaryButtonStyle())
                .padding(.horizontal, IHAcademyTheme.largePadding)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(IHAcademyTheme.largePadding)
    }
}

// MARK: - Custom Button Style
struct CancelButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(IHAcademyTheme.buttonFont)
            .foregroundColor(IHAcademyTheme.errorColor)
            .frame(height: IHAcademyTheme.buttonHeight)
            .frame(maxWidth: .infinity)
            .background(
                configuration.isPressed ? 
                IHAcademyTheme.errorColor.opacity(0.1) : 
                Color.clear
            )
            .cornerRadius(IHAcademyTheme.cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: IHAcademyTheme.cornerRadius)
                    .stroke(IHAcademyTheme.errorColor, lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - Data Models
struct Booking: Identifiable {
    let id: Int
    let className: String
    let sport: String
    let coach: String
    let date: String
    let time: String
    let location: String
    let price: Double
    var status: String
}

// MARK: - Sample Data
let sampleBookings = [
    Booking(
        id: 1,
        className: "Soccer Training",
        sport: "Soccer",
        coach: "Coach Sarah",
        date: "Today",
        time: "2:00 PM",
        location: "Field A",
        price: 150,
        status: "Confirmed"
    ),
    Booking(
        id: 2,
        className: "Basketball Drills",
        sport: "Basketball",
        coach: "Coach Mike",
        date: "Tomorrow",
        time: "4:00 PM",
        location: "Court 1",
        price: 120,
        status: "Pending"
    ),
    Booking(
        id: 3,
        className: "Tennis Lessons",
        sport: "Tennis",
        coach: "Coach Lisa",
        date: "Friday",
        time: "6:00 PM",
        location: "Tennis Courts",
        price: 200,
        status: "Confirmed"
    ),
    Booking(
        id: 4,
        className: "Rugby Practice",
        sport: "Rugby",
        coach: "Coach David",
        date: "Last Week",
        time: "5:00 PM",
        location: "Rugby Field",
        price: 180,
        status: "Completed"
    ),
    Booking(
        id: 5,
        className: "Swimming Lessons",
        sport: "Swimming",
        coach: "Coach Emma",
        date: "Last Month",
        time: "7:00 AM",
        location: "Pool",
        price: 160,
        status: "Completed"
    ),
    Booking(
        id: 6,
        className: "Cricket Training",
        sport: "Cricket",
        coach: "Coach John",
        date: "Two Weeks Ago",
        time: "9:00 AM",
        location: "Cricket Oval",
        price: 140,
        status: "Cancelled"
    )
]

struct BookingsView_Previews: PreviewProvider {
    static var previews: some View {
        BookingsView()
    }
}