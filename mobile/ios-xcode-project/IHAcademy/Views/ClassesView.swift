import SwiftUI

struct ClassesView: View {
    @State private var searchText = ""
    @State private var selectedSport = "All"
    @State private var showingFilter = false
    @State private var showingBookingAlert = false
    @State private var selectedClassName = ""
    @State private var classes = sampleClasses
    
    let sports = ["All", "Soccer", "Basketball", "Tennis", "Rugby", "Swimming", "Cricket"]
    
    var filteredClasses: [SportClass] {
        var result = classes
        
        if selectedSport != "All" {
            result = result.filter { $0.sport == selectedSport }
        }
        
        if !searchText.isEmpty {
            result = result.filter { 
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.coach.localizedCaseInsensitiveContains(searchText) ||
                $0.sport.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        return result
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search and Filter Header
                VStack(spacing: IHAcademyTheme.mediumPadding) {
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(IHAcademyTheme.textSecondary)
                        
                        TextField("Search classes, coaches, sports...", text: $searchText)
                            .font(IHAcademyTheme.bodyFont)
                    }
                    .padding(IHAcademyTheme.mediumPadding)
                    .background(IHAcademyTheme.surfaceColor)
                    .cornerRadius(IHAcademyTheme.cornerRadius)
                    .overlay(
                        RoundedRectangle(cornerRadius: IHAcademyTheme.cornerRadius)
                            .stroke(IHAcademyTheme.borderColor, lineWidth: 1)
                    )
                    
                    // Sport Filter Chips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: IHAcademyTheme.smallPadding) {
                            ForEach(sports, id: \.self) { sport in
                                SportFilterChip(
                                    sport: sport,
                                    isSelected: selectedSport == sport
                                ) {
                                    selectedSport = sport
                                }
                            }
                        }
                        .padding(.horizontal, IHAcademyTheme.mediumPadding)
                    }
                }
                .padding(.horizontal, IHAcademyTheme.mediumPadding)
                .padding(.vertical, IHAcademyTheme.mediumPadding)
                .background(IHAcademyTheme.backgroundColor)
                
                // Classes List
                if filteredClasses.isEmpty {
                    EmptyStateView()
                } else {
                    ScrollView(.vertical, showsIndicators: true) {
                        LazyVStack(spacing: IHAcademyTheme.mediumPadding) {
                            ForEach(filteredClasses) { class_ in
                                ClassCard(sportClass: class_, onBook: {
                                    selectedClassName = class_.name
                                    showingBookingAlert = true
                                })
                            }
                        }
                        .padding(.horizontal, IHAcademyTheme.mediumPadding)
                        .padding(.vertical, IHAcademyTheme.mediumPadding)
                        .frame(maxWidth: .infinity)
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            .background(IHAcademyTheme.backgroundColor)
            .navigationTitle("Classes")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingFilter.toggle() }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                            .foregroundColor(IHAcademyTheme.primaryColor)
                    }
                }
            }
        }
        .sheet(isPresented: $showingFilter) {
            FilterView(selectedSport: $selectedSport, sports: sports)
        }
        .alert("Book Class", isPresented: $showingBookingAlert) {
            Button("Book Now") { }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Demo: Would you like to book \(selectedClassName)? This is demo functionality.")
        }
    }
}

// MARK: - Supporting Views
struct SportFilterChip: View {
    let sport: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(sport)
                .font(IHAcademyTheme.captionFont)
                .foregroundColor(isSelected ? .white : IHAcademyTheme.primaryColor)
                .padding(.horizontal, IHAcademyTheme.mediumPadding)
                .padding(.vertical, IHAcademyTheme.smallPadding)
                .background(
                    isSelected ? IHAcademyTheme.primaryColor : IHAcademyTheme.surfaceColor
                )
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(IHAcademyTheme.primaryColor, lineWidth: 1)
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct ClassCard: View {
    let sportClass: SportClass
    let onBook: () -> Void
    
    var body: some View {
        VStack(spacing: IHAcademyTheme.mediumPadding) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(sportClass.name)
                        .font(IHAcademyTheme.headlineFont)
                        .foregroundColor(IHAcademyTheme.textPrimary)
                    
                    Text(sportClass.sport)
                        .font(IHAcademyTheme.captionFont)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(sportColor(for: sportClass.sport))
                        .cornerRadius(6)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("R\(Int(sportClass.price))")
                        .font(IHAcademyTheme.headlineFont)
                        .foregroundColor(IHAcademyTheme.primaryColor)
                    
                    Text("per session")
                        .font(.caption)
                        .foregroundColor(IHAcademyTheme.textSecondary)
                }
            }
            
            // Details
            VStack(spacing: IHAcademyTheme.smallPadding) {
                ClassDetailRow(icon: "person.fill", text: sportClass.coach)
                ClassDetailRow(icon: "calendar", text: "\(sportClass.day) at \(sportClass.time)")
                ClassDetailRow(icon: "mappin.and.ellipse", text: sportClass.location)
                ClassDetailRow(icon: "person.2.fill", text: "\(sportClass.spotsAvailable) spots available")
            }
            
            // Description
            if !sportClass.description.isEmpty {
                Text(sportClass.description)
                    .font(IHAcademyTheme.bodyFont)
                    .foregroundColor(IHAcademyTheme.textSecondary)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            
            // Book Button
            Button(action: onBook) {
                HStack {
                    Image(systemName: "calendar.badge.plus")
                    Text("Book Class")
                }
            }
            .buttonStyle(IHPrimaryButtonStyle())
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

struct ClassDetailRow: View {
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

struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: IHAcademyTheme.largePadding) {
            Image(systemName: "sportscourt")
                .font(.system(size: 80))
                .foregroundColor(IHAcademyTheme.textSecondary.opacity(0.5))
            
            VStack(spacing: IHAcademyTheme.smallPadding) {
                Text("No Classes Found")
                    .font(IHAcademyTheme.headlineFont)
                    .foregroundColor(IHAcademyTheme.textPrimary)
                
                Text("Try adjusting your search or filter criteria")
                    .font(IHAcademyTheme.bodyFont)
                    .foregroundColor(IHAcademyTheme.textSecondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(IHAcademyTheme.largePadding)
    }
}

struct FilterView: View {
    @Binding var selectedSport: String
    let sports: [String]
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: IHAcademyTheme.largePadding) {
                Text("Filter Classes")
                    .font(IHAcademyTheme.headlineFont)
                    .foregroundColor(IHAcademyTheme.textPrimary)
                
                VStack(alignment: .leading, spacing: IHAcademyTheme.mediumPadding) {
                    Text("Sport")
                        .font(IHAcademyTheme.captionFont)
                        .foregroundColor(IHAcademyTheme.textPrimary)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: IHAcademyTheme.smallPadding) {
                        ForEach(sports, id: \.self) { sport in
                            SportFilterChip(
                                sport: sport,
                                isSelected: selectedSport == sport
                            ) {
                                selectedSport = sport
                            }
                        }
                    }
                }
                
                Spacer()
                
                Button("Apply Filters") {
                    dismiss()
                }
                .buttonStyle(IHPrimaryButtonStyle())
            }
            .padding(IHAcademyTheme.largePadding)
            .navigationBarTitleDisplayMode(.inline)
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

// MARK: - Data Models
struct SportClass: Identifiable {
    let id: Int
    let name: String
    let sport: String
    let coach: String
    let day: String
    let time: String
    let location: String
    let price: Double
    let spotsAvailable: Int
    let description: String
}

// MARK: - Sample Data
let sampleClasses = [
    SportClass(
        id: 1,
        name: "Soccer Training",
        sport: "Soccer",
        coach: "Coach Sarah",
        day: "Monday",
        time: "2:00 PM",
        location: "Field A",
        price: 150,
        spotsAvailable: 8,
        description: "Improve your soccer skills with professional training focusing on ball control, passing, and teamwork."
    ),
    SportClass(
        id: 2,
        name: "Basketball Drills",
        sport: "Basketball",
        coach: "Coach Mike",
        day: "Tuesday",
        time: "4:00 PM",
        location: "Court 1",
        price: 120,
        spotsAvailable: 5,
        description: "Develop your basketball fundamentals including shooting, dribbling, and defensive techniques."
    ),
    SportClass(
        id: 3,
        name: "Tennis Lessons",
        sport: "Tennis",
        coach: "Coach Lisa",
        day: "Wednesday",
        time: "6:00 PM",
        location: "Tennis Courts",
        price: 200,
        spotsAvailable: 3,
        description: "Learn tennis from basics to advanced techniques with individual attention and proper form guidance."
    ),
    SportClass(
        id: 4,
        name: "Rugby Practice",
        sport: "Rugby",
        coach: "Coach David",
        day: "Thursday",
        time: "5:00 PM",
        location: "Rugby Field",
        price: 180,
        spotsAvailable: 12,
        description: "Build strength, strategy, and teamwork skills in this comprehensive rugby training session."
    ),
    SportClass(
        id: 5,
        name: "Swimming Lessons",
        sport: "Swimming",
        coach: "Coach Emma",
        day: "Friday",
        time: "7:00 AM",
        location: "Pool",
        price: 160,
        spotsAvailable: 6,
        description: "Learn swimming techniques for all levels, from beginners to competitive swimming preparation."
    ),
    SportClass(
        id: 6,
        name: "Cricket Training",
        sport: "Cricket",
        coach: "Coach John",
        day: "Saturday",
        time: "9:00 AM",
        location: "Cricket Oval",
        price: 140,
        spotsAvailable: 10,
        description: "Master cricket skills including batting, bowling, and fielding in a professional training environment."
    )
]

struct ClassesView_Previews: PreviewProvider {
    static var previews: some View {
        ClassesView()
    }
}