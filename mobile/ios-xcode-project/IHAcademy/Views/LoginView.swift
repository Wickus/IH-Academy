import SwiftUI

struct LoginView: View {
    @Binding var isLoggedIn: Bool
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(spacing: 0) {
                    // Header with IH Academy branding
                    VStack(spacing: IHAcademyTheme.mediumPadding) {
                        // IH Academy Whistle Logo
                        Image(systemName: "sportscourt.fill")
                            .font(.system(size: 80))
                            .foregroundStyle(IHAcademyTheme.primaryGradient)
                            .padding(.top, 60)
                        
                        VStack(spacing: 8) {
                            Text("IH Academy")
                                .font(IHAcademyTheme.titleFont)
                                .foregroundColor(IHAcademyTheme.primaryColor)
                            
                            Text("Sports Academy Management")
                                .font(IHAcademyTheme.captionFont)
                                .foregroundColor(IHAcademyTheme.textSecondary)
                        }
                    }
                    .padding(.bottom, 50)
                    
                    // Login Form Card
                    VStack(spacing: IHAcademyTheme.largePadding) {
                        VStack(spacing: IHAcademyTheme.mediumPadding) {
                            Text("Welcome Back")
                                .font(IHAcademyTheme.headlineFont)
                                .foregroundColor(IHAcademyTheme.textPrimary)
                            
                            Text("Sign in to access your academy")
                                .font(IHAcademyTheme.bodyFont)
                                .foregroundColor(IHAcademyTheme.textSecondary)
                                .multilineTextAlignment(.center)
                        }
                        
                        VStack(spacing: IHAcademyTheme.mediumPadding) {
                            // Email Field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Email")
                                    .font(IHAcademyTheme.captionFont)
                                    .foregroundColor(IHAcademyTheme.textPrimary)
                                
                                TextField("Enter your email", text: $email)
                                    .textFieldStyle(IHTextFieldStyle())
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .autocorrectionDisabled()
                            }
                            
                            // Password Field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Password")
                                    .font(IHAcademyTheme.captionFont)
                                    .foregroundColor(IHAcademyTheme.textPrimary)
                                
                                SecureField("Enter your password", text: $password)
                                    .textFieldStyle(IHTextFieldStyle())
                            }
                            
                            // Forgot Password
                            HStack {
                                Spacer()
                                Button("Forgot Password?") {
                                    // Handle forgot password
                                }
                                .font(IHAcademyTheme.captionFont)
                                .foregroundColor(IHAcademyTheme.secondaryColor)
                            }
                        }
                        
                        VStack(spacing: IHAcademyTheme.mediumPadding) {
                            // Login Button
                            Button(action: handleLogin) {
                                HStack {
                                    if isLoading {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                            .scaleEffect(0.8)
                                    }
                                    Text(isLoading ? "Signing In..." : "Sign In")
                                }
                            }
                            .buttonStyle(IHPrimaryButtonStyle())
                            .disabled(email.isEmpty || password.isEmpty || isLoading)
                            
                            // Demo Login
                            VStack(spacing: 12) {
                                Text("Demo Accounts")
                                    .font(IHAcademyTheme.captionFont)
                                    .foregroundColor(IHAcademyTheme.textSecondary)
                                
                                HStack(spacing: 12) {
                                    Button("Member") {
                                        loginAsDemo(role: "member")
                                    }
                                    .buttonStyle(IHSecondaryButtonStyle())
                                    .frame(maxWidth: .infinity)
                                    
                                    Button("Coach") {
                                        loginAsDemo(role: "coach")
                                    }
                                    .buttonStyle(IHSecondaryButtonStyle())
                                    .frame(maxWidth: .infinity)
                                    
                                    Button("Admin") {
                                        loginAsDemo(role: "admin")
                                    }
                                    .buttonStyle(IHSecondaryButtonStyle())
                                    .frame(maxWidth: .infinity)
                                }
                            }
                            
                            // Register Link
                            HStack {
                                Text("Don't have an account?")
                                    .font(IHAcademyTheme.bodyFont)
                                    .foregroundColor(IHAcademyTheme.textSecondary)
                                
                                Button("Create Account") {
                                    // Handle registration
                                }
                                .font(IHAcademyTheme.bodyFont)
                                .foregroundColor(IHAcademyTheme.secondaryColor)
                            }
                        }
                    }
                    .padding(IHAcademyTheme.largePadding)
                    .ihCardStyle()
                    .padding(.horizontal, IHAcademyTheme.mediumPadding)
                }
                .frame(minHeight: geometry.size.height)
            }
        }
        .background(IHAcademyTheme.backgroundColor)
        .alert("Login Failed", isPresented: $showAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
    }
    
    private func handleLogin() {
        isLoading = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isLoading = false
            
            // Demo validation - accept all demo accounts and admin
            if email.lowercased().contains("demo") || 
               email.lowercased().contains("@ihacademy.africa") ||
               email.lowercased().contains("admin") ||
               email.lowercased().contains("member") ||
               email.lowercased().contains("coach") {
                withAnimation(.easeInOut(duration: 0.5)) {
                    isLoggedIn = true
                }
            } else {
                alertMessage = "Please use the demo account buttons below or contact your administrator"
                showAlert = true
            }
        }
    }
    
    private func loginAsDemo(role: String) {
        isLoading = true
        email = "\(role)@ihacademy.africa"
        password = "demo123"
        
        // Immediate demo login without validation delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            isLoading = false
            withAnimation(.easeInOut(duration: 0.5)) {
                isLoggedIn = true
            }
        }
    }
}

// MARK: - Custom Text Field Style
struct IHTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<_Label>) -> some View {
        configuration
            .font(IHAcademyTheme.bodyFont)
            .padding(IHAcademyTheme.mediumPadding)
            .background(IHAcademyTheme.surfaceColor)
            .cornerRadius(IHAcademyTheme.cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: IHAcademyTheme.cornerRadius)
                    .stroke(IHAcademyTheme.borderColor, lineWidth: 1)
            )
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView(isLoggedIn: .constant(false))
    }
}