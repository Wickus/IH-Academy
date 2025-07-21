import SwiftUI

struct IHAcademyTheme {
    // IH Academy Brand Colors
    static let primaryColor = Color(red: 0.125, green: 0.212, blue: 0.420)     // #20366B
    static let secondaryColor = Color(red: 0.157, green: 0.553, blue: 0.831)   // #278DD4
    static let accentColor = Color(red: 0.141, green: 0.827, blue: 0.404)      // #24D367
    
    // Supporting Colors
    static let backgroundColor = Color(red: 0.961, green: 0.969, blue: 0.980)  // #F5F7FA
    static let surfaceColor = Color.white
    static let textPrimary = Color(red: 0.125, green: 0.125, blue: 0.125)      // #202020
    static let textSecondary = Color(red: 0.435, green: 0.459, blue: 0.486)    // #6F757C
    static let borderColor = Color(red: 0.898, green: 0.918, blue: 0.941)      // #E5EAEF
    
    // Success/Warning/Error
    static let successColor = accentColor
    static let warningColor = Color(red: 1.0, green: 0.647, blue: 0.0)         // #FFA500
    static let errorColor = Color(red: 0.863, green: 0.196, blue: 0.184)       // #DC3232
    
    // Gradients
    static let primaryGradient = LinearGradient(
        colors: [primaryColor, secondaryColor],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let accentGradient = LinearGradient(
        colors: [secondaryColor, accentColor],
        startPoint: .leading,
        endPoint: .trailing
    )
}

// MARK: - Typography
extension IHAcademyTheme {
    static let titleFont = Font.system(size: 28, weight: .bold, design: .default)
    static let headlineFont = Font.system(size: 22, weight: .semibold, design: .default)
    static let bodyFont = Font.system(size: 16, weight: .regular, design: .default)
    static let captionFont = Font.system(size: 14, weight: .medium, design: .default)
    static let buttonFont = Font.system(size: 16, weight: .semibold, design: .default)
}

// MARK: - Spacing & Sizing
extension IHAcademyTheme {
    static let cornerRadius: CGFloat = 12
    static let cardCornerRadius: CGFloat = 16
    static let smallPadding: CGFloat = 8
    static let mediumPadding: CGFloat = 16
    static let largePadding: CGFloat = 24
    static let buttonHeight: CGFloat = 50
    static let cardElevation: CGFloat = 2
}

// MARK: - Custom Modifiers
struct IHCardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(IHAcademyTheme.surfaceColor)
            .cornerRadius(IHAcademyTheme.cardCornerRadius)
            .shadow(color: Color.black.opacity(0.1), radius: IHAcademyTheme.cardElevation, x: 0, y: 1)
    }
}

struct IHPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(IHAcademyTheme.buttonFont)
            .foregroundColor(.white)
            .frame(height: IHAcademyTheme.buttonHeight)
            .frame(maxWidth: .infinity)
            .background(
                configuration.isPressed ? 
                IHAcademyTheme.primaryColor.opacity(0.8) : 
                IHAcademyTheme.primaryColor
            )
            .cornerRadius(IHAcademyTheme.cornerRadius)
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct IHSecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(IHAcademyTheme.buttonFont)
            .foregroundColor(IHAcademyTheme.primaryColor)
            .frame(height: IHAcademyTheme.buttonHeight)
            .frame(maxWidth: .infinity)
            .background(
                configuration.isPressed ? 
                IHAcademyTheme.borderColor.opacity(0.8) : 
                IHAcademyTheme.borderColor
            )
            .cornerRadius(IHAcademyTheme.cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: IHAcademyTheme.cornerRadius)
                    .stroke(IHAcademyTheme.primaryColor, lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - View Extensions
extension View {
    func ihCardStyle() -> some View {
        modifier(IHCardStyle())
    }
}