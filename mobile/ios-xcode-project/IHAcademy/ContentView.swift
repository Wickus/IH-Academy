import SwiftUI

struct ContentView: View {
    @State private var isLoggedIn = false
    @State private var selectedTab = 0
    
    var body: some View {
        if isLoggedIn {
            TabView(selection: $selectedTab) {
                DashboardView()
                    .tabItem {
                        Image(systemName: "house.fill")
                        Text("Dashboard")
                    }
                    .tag(0)
                
                ClassesView()
                    .tabItem {
                        Image(systemName: "sportscourt.fill")
                        Text("Classes")
                    }
                    .tag(1)
                
                BookingsView()
                    .tabItem {
                        Image(systemName: "calendar.badge.plus")
                        Text("Bookings")
                    }
                    .tag(2)
                
                ProfileView()
                    .tabItem {
                        Image(systemName: "person.fill")
                        Text("Profile")
                    }
                    .tag(3)
            }
            .accentColor(IHAcademyTheme.primaryColor)
        } else {
            LoginView(isLoggedIn: $isLoggedIn)
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}