import SwiftUI

private let cloudSync = GitHubSyncService()
enum AppFontProfile: String, CaseIterable, Identifiable {
    case system = "System Minimal"
    case avenir = "Avenir Next"
    case georgia = "Georgia"
    case courier = "Courier New"
    
    var id: String { self.rawValue }
    
    func customFont(size: CGFloat, weight: Font.Weight = .regular, isItalic: Bool = false) -> Font {
        var baseFont: Font
        switch self {
        case .system:
            baseFont = Font.system(size: size, weight: weight, design: .default)
        case .avenir:
            baseFont = Font.custom("Avenir Next", size: size)
        case .georgia:
            baseFont = Font.custom("Georgia", size: size)
        case .courier:
            baseFont = Font.custom("Courier", size: size)
        }
        
        if self != .system && (weight == .bold || weight == .medium) {
            baseFont = baseFont.bold()
        }
        
        return isItalic ? baseFont.italic() : baseFont
    }
}

struct ZenFontModifier: ViewModifier {
    let profile: AppFontProfile
    let size: CGFloat
    let weight: Font.Weight
    let isItalic: Bool
    
    func body(content: Content) -> some View {
        content.font(profile.customFont(size: size, weight: weight, isItalic: isItalic))
    }
}

extension View {
    func zenFont(_ profile: AppFontProfile, size: CGFloat, weight: Font.Weight = .regular, isItalic: Bool = false) -> some View {
        self.modifier(ZenFontModifier(profile: profile, size: size, weight: weight, isItalic: isItalic))
    }
}

enum AmbientPalette: String, CaseIterable, Identifiable {
    case cocoa = "Cocoa Zen"
    case moss = "Forest Moss"
    case storm = "Abyssal Storm"
    case dark = "Complete Dark"
    
    var id: String { self.rawValue }
    
    var backgroundGradient: Gradient {
        switch self {
        case .cocoa:
            return Gradient(colors: [Color(red: 0.15, green: 0.11, blue: 0.09), Color(red: 0.08, green: 0.05, blue: 0.04)])
        case .moss:
            return Gradient(colors: [Color(red: 0.14, green: 0.19, blue: 0.16), Color(red: 0.06, green: 0.09, blue: 0.08)])
        case .storm:
            return Gradient(colors: [Color(red: 0.09, green: 0.11, blue: 0.16), Color(red: 0.04, green: 0.05, blue: 0.08)])
        case .dark:
            return Gradient(colors: [Color(red: 0.02, green: 0.02, blue: 0.02), Color.black])
        }
    }
}

struct MeditationSession: Identifiable, Codable {
    var id = UUID()
    let date: Date
    var durationInMinutes: Double
    var statePath: [Int]
    
    var maximumDepthReached: Int {
        statePath.max() ?? 0
    }
}

struct SheetContext: Identifiable {
    let id = UUID()
    let targetSession: MeditationSession?
    let isEditing: Bool
}

struct ContentView: View {
    @AppStorage("selected_app_font") private var activeFont: AppFontProfile = .system
    @State private var activePalette: AmbientPalette = .storm
    @State private var activeSheetContext: SheetContext? = nil
    
    @State private var sessions: [MeditationSession] = []
    @State private var currentStreak: Int = 0
    @State private var peakDepth: Int = 0
    
    var totalHours: Double {
        sessions.reduce(0) { $0 + $1.durationInMinutes } / 60.0
    }
    
    @State private var showHowItWorks: Bool = false
    @State private var shareImageItem: ShareImageContainer? = nil
    
    var body: some View {
        ZStack {
            LinearGradient(gradient: activePalette.backgroundGradient, startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("MyZen")
                            .zenFont(activeFont, size: 34, weight: .light)
                            .foregroundColor(.white.opacity(0.95))
                        Text("Grounded and Present")
                            .zenFont(activeFont, size: 14, isItalic: true)
                            .foregroundColor(.white.opacity(0.5))
                    }
                    Spacer()
                    
                    HStack(spacing: 12) {
                        Button(action: {
                            showHowItWorks = true
                        }) {
                            Image(systemName: "questionmark.circle")
                                .font(.system(size: 14, weight: .light))
                                .foregroundColor(.white.opacity(0.7))
                                .padding(12)
                                .background(Color.white.opacity(0.06))
                                .clipShape(Circle())
                        }
                        
                        Menu {
                            ForEach(AppFontProfile.allCases) { fontOption in
                                Button(action: { activeFont = fontOption }) {
                                    AppHStack {
                                        Text(fontOption.rawValue)
                                        if fontOption == activeFont {
                                            Image(systemName: "checkmark")
                                        }
                                    }
                                }
                            }
                        } label: {
                            Image(systemName: "textformat")
                                .font(.system(size: 14, weight: .light))
                                .foregroundColor(.white.opacity(0.6))
                                .padding(12)
                                .background(Color.white.opacity(0.06))
                                .clipShape(Circle())
                        }
                        
                        Menu {
                            ForEach(AmbientPalette.allCases) { palette in
                                Button(action: {
                                    withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                                        activePalette = palette
                                    }
                                }) {
                                    AppHStack {
                                        Text(palette.rawValue)
                                        if palette == activePalette {
                                            Image(systemName: "checkmark")
                                        }
                                    }
                                }
                            }
                        } label: {
                            Image(systemName: "paintpalette")
                                .font(.system(size: 14, weight: .light))
                                .foregroundColor(.white.opacity(0.6))
                                .padding(12)
                                .background(Color.white.opacity(0.06))
                                .clipShape(Circle())
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 16)
                
                Spacer(minLength: 10)
                
                ZStack {
                    HomeTreeView(inkColor: Color(white: 0.95))
                        .mask(
                            ZStack {
                                LinearGradient(
                                    gradient: Gradient(stops: [
                                        .init(color: .clear, location: 0.0),
                                        .init(color: .black, location: 0.15),
                                        .init(color: .black, location: 0.85),
                                        .init(color: .clear, location: 1.0)
                                    ]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                                
                                LinearGradient(
                                    gradient: Gradient(stops: [
                                        .init(color: .clear, location: 0.0),
                                        .init(color: .black, location: 0.15),
                                        .init(color: .black, location: 0.85),
                                        .init(color: .clear, location: 1.0)
                                    ]),
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                                .blendMode(.multiply)
                            }
                        )
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.horizontal, 24)
                
                Spacer(minLength: 10)
                
                VStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("LIVE TIME STATS")
                            .zenFont(activeFont, size: 9, weight: .bold)
                            .tracking(1.5)
                            .foregroundColor(.white.opacity(0.4))
                            .padding(.horizontal, 4)
                        
                        HStack(spacing: 0) {
                            StatView(activeFont: activeFont, value: String(format: "%.1f", totalHours), label: "Total Hours", progress: totalHours > 0 ? min(totalHours / 50.0, 1.0) : 0.0)
                            Spacer()
                            Rectangle()
                                .fill(Color.white.opacity(0.08))
                                .frame(width: 1, height: 35)
                            Spacer()
                            StatView(activeFont: activeFont, value: "\(currentStreak)", label: "Current Streak", progress: currentStreak > 0 ? min(Double(currentStreak) / 30.0, 1.0) : 0.0)
                            Spacer()
                            Rectangle()
                                .fill(Color.white.opacity(0.08))
                                .frame(width: 1, height: 35)
                            Spacer()
                            StatView(activeFont: activeFont, value: peakDepth > 0 ? "\(peakDepth)/8" : "—", label: "Peak Depth", progress: peakDepth > 0 ? min(Double(peakDepth) / 8.0, 1.0) : 0.0)
                        }
                        .padding(.vertical, 12)
                        .background(Color.white.opacity(0.03))
                        .cornerRadius(14)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Color.white.opacity(0.05), lineWidth: 1)
                        )
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("LAST SESSION STATS")
                                .zenFont(activeFont, size: 9, weight: .bold)
                                .tracking(1.5)
                                .foregroundColor(.white.opacity(0.4))
                                .padding(.horizontal, 4)
                            
                            Spacer()
                            
                            if let lastSession = sessions.last {
                                Button(action: {
                                    triggerGraphicShare(session: lastSession)
                                }) {
                                    HStack(spacing: 4) {
                                        Image(systemName: "square.and.arrow.up")
                                            .font(.system(size: 11))
                                        Text("Share Card")
                                            .font(.system(size: 11, weight: .medium))
                                    }
                                    .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                                }
                                .padding(.trailing, 4)
                            }
                        }
                        
                        if let lastSession = sessions.last {
                            HStack(spacing: 16) {
                                VStack(spacing: 2) {
                                    Text("\(lastSession.maximumDepthReached)")
                                        .zenFont(activeFont, size: 22, weight: .medium)
                                        .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                                    Text("DEPTH")
                                        .zenFont(activeFont, size: 8, weight: .light)
                                        .tracking(1.0)
                                        .foregroundColor(.white.opacity(0.4))
                                }
                                .frame(width: 60, height: 60)
                                .background(Color.white.opacity(0.05))
                                .clipShape(Circle())
                                .overlay(
                                    Circle().stroke(Color(red: 0.35, green: 0.62, blue: 0.60).opacity(0.5), lineWidth: 1)
                                )
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("\"\(Int(lastSession.durationInMinutes)) Minute Session\"")
                                        .zenFont(activeFont, size: 14, weight: .medium)
                                        .foregroundColor(.white.opacity(0.9))
                                    
                                    let maxStageInt = lastSession.maximumDepthReached
                                    Text("Stage \(maxStageInt): \(patanjaliLimbName(for: maxStageInt))")
                                        .zenFont(activeFont, size: 12)
                                        .foregroundColor(.white.opacity(0.5))
                                    
                                    Text(lastSession.date.formatted(date: .abbreviated, time: .shortened))
                                        .zenFont(activeFont, size: 10)
                                        .foregroundColor(.white.opacity(0.3))
                                }
                                Spacer()
                            }
                            .padding(14)
                            .background(Color.white.opacity(0.03))
                            .cornerRadius(14)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(Color.white.opacity(0.05), lineWidth: 1)
                            )
                        } else {
                            HStack {
                                Spacer()
                                VStack(spacing: 6) {
                                    Image(systemName: "leaf.fill")
                                        .font(.system(size: 14))
                                        .foregroundColor(.white.opacity(0.2))
                                    Text("Your journey begins with your first reflection.")
                                        .zenFont(activeFont, size: 12, isItalic: true)
                                        .foregroundColor(.white.opacity(0.3))
                                }
                                Spacer()
                            }
                            .padding(.vertical, 20)
                            .background(Color.white.opacity(0.03))
                            .cornerRadius(14)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(Color.white.opacity(0.05), lineWidth: 1)
                            )
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 6)
                .padding(.bottom, 16)
                
                VStack(spacing: 10) {
                    Button(action: {
                        activeSheetContext = SheetContext(targetSession: nil, isEditing: false)
                    }) {
                        Text("Log Reflection")
                            .zenFont(activeFont, size: 17, weight: .light)
                            .foregroundColor(.black.opacity(0.85))
                            .padding(.vertical, 14)
                            .frame(maxWidth: .infinity)
                            .background(Color.white.opacity(0.92))
                            .cornerRadius(14)
                    }
                    
                    if !sessions.isEmpty {
                        Button(action: {
                            activeSheetContext = SheetContext(targetSession: sessions.last, isEditing: true)
                        }) {
                            AppHStack {
                                Image(systemName: "pencil.line")
                                Text("Edit Last Entry Journey")
                            }
                            .zenFont(activeFont, size: 13)
                            .foregroundColor(.white.opacity(0.6))
                            .padding(.vertical, 8)
                            .frame(maxWidth: .infinity)
                            .background(Color.white.opacity(0.05))
                            .cornerRadius(10)
                        }
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
            
            if showHowItWorks {
                Color.black.opacity(0.8)
                    .ignoresSafeArea()
                    .onTapGesture { showHowItWorks = false }
                
                HowItWorksView(activeFont: activeFont) {
                    showHowItWorks = false
                }
                .padding(.horizontal, 24)
                .transition(.scale.combined(with: .opacity))
                .zIndex(100)
            }
        }
        .onAppear(perform: loadData)
        .sheet(item: $activeSheetContext) { context in
            LogSessionView(
                activeFont: activeFont,
                activePalette: activePalette,
                initialMinutes: context.targetSession?.durationInMinutes,
                initialPath: context.targetSession?.statePath
            ) { duration, path in
                if context.isEditing {
                    updateLastSession(duration: duration, path: path)
                } else {
                    saveNewSession(duration: duration, path: path)
                }
            }
        }
        .sheet(item: $shareImageItem) { container in
            ActivityView(activityItems: [container.image])
        }
    }
    
    private func saveNewSession(duration: Double, path: [Int]) {
        let newSession = MeditationSession(date: Date(), durationInMinutes: duration, statePath: path)
        sessions.append(newSession)
        persistSessionsAndRecalculate()
    }
    
    private func updateLastSession(duration: Double, path: [Int]) {
        guard !sessions.isEmpty else { return }
        sessions[sessions.count - 1].durationInMinutes = duration
        sessions[sessions.count - 1].statePath = path
        persistSessionsAndRecalculate()
    }
    
    private func persistSessionsAndRecalculate() {
        if let encoded = try? JSONEncoder().encode(sessions) {
            UserDefaults.standard.set(encoded, forKey: "meditation_sessions")
        }
        
        // Push the updated data text array up to GitHub
        cloudSync.syncSessionsToCloud(sessions: sessions)
        
        withAnimation(.easeInOut) {
            evaluateMetrics()
        }
    }
    
    private func loadData() {
        if let data = UserDefaults.standard.data(forKey: "meditation_sessions"),
           let decoded = try? JSONDecoder().decode([MeditationSession].self, from: data) {
            self.sessions = decoded
        }
        evaluateMetrics()
    }
    
    private func evaluateMetrics() {
        guard !sessions.isEmpty else {
            currentStreak = 0
            peakDepth = 0
            return
        }
        self.peakDepth = sessions.map { $0.maximumDepthReached }.max() ?? 0
        
        let calendar = Calendar.current
        let dates = sessions.map { calendar.startOfDay(for: $0.date) }
        let uniqueDates = Set(dates).sorted(by: >)
        
        var calculatedStreak = 0
        var checkDate = calendar.startOfDay(for: Date())
        
        if uniqueDates.contains(checkDate) || uniqueDates.contains(calendar.date(byAdding: .day, value: -1, to: checkDate)!) {
            if !uniqueDates.contains(checkDate) {
                checkDate = calendar.date(byAdding: .day, value: -1, to: checkDate)!
            }
            while uniqueDates.contains(checkDate) {
                calculatedStreak += 1
                guard let nextDate = calendar.date(byAdding: .day, value: -1, to: checkDate) else { break }
                checkDate = nextDate
            }
        }
        self.currentStreak = calculatedStreak
    }
    
    private func patanjaliLimbName(for level: Int) -> String {
        switch level {
        case 1: return "YAMA"
        case 2: return "NIYAMA"
        case 3: return "ASANA"
        case 4: return "PRANAYAMA"
        case 5: return "PRATYAHARA"
        case 6: return "DHARANA"
        case 7: return "DHYANA"
        case 8: return "SAMADHI"
        default: return ""
        }
    }
    
    @MainActor
    private func triggerGraphicShare(session: MeditationSession) {
        let card = ShareCardView(session: session, activeFont: activeFont, activePalette: activePalette)
            .frame(width: 420, height: 420)
        
        let renderer = ImageRenderer(content: card)
        renderer.scale = 3.0
        
        if let uiImage = renderer.uiImage {
            self.shareImageItem = ShareImageContainer(image: uiImage)
        }
    }
}

struct ShareImageContainer: Identifiable {
    let id = UUID()
    let image: UIImage
}

struct ActivityView: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

struct AppHStack<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View { HStack { content } }
}

struct StatView: View {
    let activeFont: AppFontProfile
    let value: String
    let label: String
    let progress: Double
    
    var body: some View {
        VStack(spacing: 4) {
            Text(label.uppercased())
                .zenFont(activeFont, size: 9, weight: .light)
                .tracking(1.0)
                .foregroundColor(.white.opacity(0.4))
            
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 45, height: 2)
                Capsule()
                    .fill(Color(red: 0.35, green: 0.62, blue: 0.60))
                    .frame(width: 45 * CGFloat(max(0.0, min(1.0, progress))), height: 2)
            }
            
            Text(value)
                .zenFont(activeFont, size: 18, weight: .light)
                .foregroundColor(.white.opacity(0.95))
                .padding(.top, 2)
        }
        .frame(maxWidth: .infinity)
    }
}

struct HomeTreeView: View {
    let inkColor: Color
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color.clear
                
                Path { path in
                    path.move(to: CGPoint(x: 0, y: geo.size.height * 0.78))
                    path.addQuadCurve(to: CGPoint(x: geo.size.width, y: geo.size.height * 0.83), control: CGPoint(x: geo.size.width * 0.5, y: geo.size.height * 0.76))
                }
                .stroke(inkColor.opacity(0.4), style: StrokeStyle(lineWidth: 1, lineCap: .round))
                
                Path { path in
                    let centerX = geo.size.width * 0.5
                    let treeScaleWidth = min(geo.size.width, geo.size.height * 1.15)
                    
                    func ax(_ fraction: CGFloat) -> CGFloat {
                        return centerX + (fraction - 0.5) * treeScaleWidth
                    }
                    
                    path.move(to: CGPoint(x: ax(0.47), y: geo.size.height * 0.80))
                    path.addCurve(to: CGPoint(x: ax(0.50), y: geo.size.height * 0.45),
                                  control1: CGPoint(x: ax(0.49), y: geo.size.height * 0.70),
                                  control2: CGPoint(x: ax(0.46), y: geo.size.height * 0.56))
                    path.addLine(to: CGPoint(x: ax(0.56), y: geo.size.height * 0.41))
                    path.move(to: CGPoint(x: ax(0.50), y: geo.size.height * 0.45))
                    path.addLine(to: CGPoint(x: ax(0.45), y: geo.size.height * 0.39))
                    
                    path.move(to: CGPoint(x: ax(0.53), y: geo.size.height * 0.80))
                    path.addCurve(to: CGPoint(x: ax(0.51), y: geo.size.height * 0.48),
                                  control1: CGPoint(x: ax(0.53), y: geo.size.height * 0.70),
                                  control2: CGPoint(x: ax(0.50), y: geo.size.height * 0.58))
                    
                    path.move(to: CGPoint(x: ax(0.50), y: geo.size.height * 0.76))
                    path.addLine(to: CGPoint(x: ax(0.49), y: geo.size.height * 0.55))
                }
                .stroke(inkColor.opacity(0.75), style: StrokeStyle(lineWidth: 1.5, lineCap: .round))
                
                Group {
                    Circle().stroke(inkColor.opacity(0.35), style: StrokeStyle(lineWidth: 0.75))
                        .frame(width: 80, height: 45).offset(x: 15, y: -20)
                    Circle().stroke(inkColor.opacity(0.25), style: StrokeStyle(lineWidth: 0.75))
                        .frame(width: 65, height: 35).offset(x: 15, y: -20)
                    Circle().stroke(inkColor.opacity(0.30), style: StrokeStyle(lineWidth: 0.75))
                        .frame(width: 60, height: 35).offset(x: -30, y: -30)
                    Circle().stroke(inkColor.opacity(0.40), style: StrokeStyle(lineWidth: 1))
                        .frame(width: 70, height: 40).offset(x: 35, y: -40)
                    
                    Circle().stroke(inkColor.opacity(0.32), style: StrokeStyle(lineWidth: 0.85))
                        .frame(width: 75, height: 42).offset(x: -12, y: -45)
                    Circle().stroke(inkColor.opacity(0.22), style: StrokeStyle(lineWidth: 0.70))
                        .frame(width: 50, height: 30).offset(x: 45, y: -10)
                    Circle().stroke(inkColor.opacity(0.28), style: StrokeStyle(lineWidth: 0.80))
                        .frame(width: 85, height: 48).offset(x: 5, y: -32)
                    Circle().stroke(inkColor.opacity(0.38), style: StrokeStyle(lineWidth: 0.90))
                        .frame(width: 55, height: 32).offset(x: -42, y: -15)
                }
                .offset(x: 0, y: -12)
                
                ForEach(0..<8) { idx in
                    Path { p in
                        let centerX = geo.size.width * 0.5
                        let treeScaleWidth = min(geo.size.width, geo.size.height * 1.15)
                        
                        func ax(_ fraction: CGFloat) -> CGFloat {
                            return centerX + (fraction - 0.5) * treeScaleWidth
                        }
                        
                        let spacingMultiplier = CGFloat(idx)
                        let driftX = ax(0.63) + (spacingMultiplier * 10)
                        let driftY = geo.size.height * 0.37 + CGFloat((idx % 3) * 12)
                        
                        p.move(to: CGPoint(x: driftX, y: driftY))
                        p.addQuadCurve(to: CGPoint(x: driftX + 4, y: driftY - 3),
                                       control: CGPoint(x: driftX + 2, y: driftY - 5))
                    }
                    .stroke(inkColor.opacity(0.42), lineWidth: 0.9)
                }
            }
        }
    }
}

struct ShareTreeView: View {
    let inkColor: Color
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color.clear
                
                Path { path in
                    path.move(to: CGPoint(x: 0, y: geo.size.height * 0.78))
                    path.addQuadCurve(to: CGPoint(x: geo.size.width, y: geo.size.height * 0.83), control: CGPoint(x: geo.size.width * 0.5, y: geo.size.height * 0.76))
                }
                .stroke(inkColor.opacity(0.4), style: StrokeStyle(lineWidth: 1, lineCap: .round))
                
                Path { path in
                    let centerX = geo.size.width * 0.5
                    let treeScaleWidth = min(geo.size.width, geo.size.height * 1.15)
                    
                    func ax(_ fraction: CGFloat) -> CGFloat {
                        return centerX + (fraction - 0.5) * treeScaleWidth
                    }
                    
                    path.move(to: CGPoint(x: ax(0.47), y: geo.size.height * 0.80))
                    path.addCurve(to: CGPoint(x: ax(0.50), y: geo.size.height * 0.45),
                                  control1: CGPoint(x: ax(0.49), y: geo.size.height * 0.70),
                                  control2: CGPoint(x: ax(0.46), y: geo.size.height * 0.56))
                    path.addLine(to: CGPoint(x: ax(0.56), y: geo.size.height * 0.41))
                    path.move(to: CGPoint(x: ax(0.50), y: geo.size.height * 0.45))
                    path.addLine(to: CGPoint(x: ax(0.45), y: geo.size.height * 0.39))
                    
                    path.move(to: CGPoint(x: ax(0.53), y: geo.size.height * 0.80))
                    path.addCurve(to: CGPoint(x: ax(0.51), y: geo.size.height * 0.48),
                                  control1: CGPoint(x: ax(0.53), y: geo.size.height * 0.70),
                                  control2: CGPoint(x: ax(0.50), y: geo.size.height * 0.58))
                    
                    path.move(to: CGPoint(x: ax(0.50), y: geo.size.height * 0.76))
                    path.addLine(to: CGPoint(x: ax(0.49), y: geo.size.height * 0.55))
                }
                .stroke(inkColor.opacity(0.75), style: StrokeStyle(lineWidth: 1.2, lineCap: .round))
                
                Group {
                    Circle().stroke(inkColor.opacity(0.35), style: StrokeStyle(lineWidth: 0.6))
                        .frame(width: 48, height: 26).offset(x: 8, y: -12)
                    Circle().stroke(inkColor.opacity(0.25), style: StrokeStyle(lineWidth: 0.6))
                        .frame(width: 38, height: 20).offset(x: 8, y: -12)
                    Circle().stroke(inkColor.opacity(0.30), style: StrokeStyle(lineWidth: 0.6))
                        .frame(width: 36, height: 20).offset(x: -18, y: -18)
                    Circle().stroke(inkColor.opacity(0.40), style: StrokeStyle(lineWidth: 0.8))
                        .frame(width: 42, height: 24).offset(x: 20, y: -24)
                    
                    Circle().stroke(inkColor.opacity(0.32), style: StrokeStyle(lineWidth: 0.7))
                        .frame(width: 44, height: 24).offset(x: -8, y: -26)
                    Circle().stroke(inkColor.opacity(0.22), style: StrokeStyle(lineWidth: 0.6))
                        .frame(width: 30, height: 18).offset(x: 26, y: -6)
                    Circle().stroke(inkColor.opacity(0.28), style: StrokeStyle(lineWidth: 0.6))
                        .frame(width: 50, height: 28).offset(x: 4, y: -18)
                    Circle().stroke(inkColor.opacity(0.38), style: StrokeStyle(lineWidth: 0.7))
                        .frame(width: 32, height: 18).offset(x: -24, y: -8)
                }
                .offset(x: 0, y: -4)
                
                ForEach(0..<6) { idx in
                    Path { p in
                        let centerX = geo.size.width * 0.5
                        let treeScaleWidth = min(geo.size.width, geo.size.height * 1.15)
                        
                        func ax(_ fraction: CGFloat) -> CGFloat {
                            return centerX + (fraction - 0.5) * treeScaleWidth
                        }
                        
                        let spacingMultiplier = CGFloat(idx)
                        let driftX = ax(0.62) + (spacingMultiplier * 6)
                        let driftY = geo.size.height * 0.38 + CGFloat((idx % 2) * 8)
                        
                        p.move(to: CGPoint(x: driftX, y: driftY))
                        p.addQuadCurve(to: CGPoint(x: driftX + 2.5, y: driftY - 2),
                                       control: CGPoint(x: driftX + 1.2, y: driftY - 3))
                    }
                    .stroke(inkColor.opacity(0.42), lineWidth: 0.6)
                }
            }
        }
    }
}

struct ShareCardView: View {
    let session: MeditationSession
    let activeFont: AppFontProfile
    let activePalette: AmbientPalette
    
    private var depth: Int {
        session.maximumDepthReached
    }
    
    var body: some View {
        VStack(spacing: 0) {
            ShareTreeView(inkColor: .white)
                .frame(height: 120)
                .padding(.top, 40)
                .padding(.bottom, 20)
            
            VStack(spacing: 12) {
                VStack(spacing: 3) {
                    Text("TODAY'S MEDITATION QUALITY")
                        .zenFont(activeFont, size: 10, weight: .bold)
                        .tracking(2.5)
                        .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                    
                    Text("DEPTH & ALIGNMENT PROFILE")
                        .zenFont(activeFont, size: 13, weight: .light)
                        .tracking(1.5)
                        .foregroundColor(.white.opacity(0.75))
                }
                
                VStack(spacing: 10) {
                    VStack(spacing: 2) {
                        Text("\(depth)")
                            .zenFont(activeFont, size: 56, weight: .ultraLight)
                            .foregroundColor(.white)
                        
                        Text("STAGE \(depth): \(patanjaliLimbName(for: depth))")
                            .zenFont(activeFont, size: 11, weight: .bold)
                            .tracking(2.0)
                            .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                        
                        Text("MAXIMUM DEPTH ACHIEVED")
                            .zenFont(activeFont, size: 8, weight: .semibold)
                            .tracking(1.0)
                            .foregroundColor(.white.opacity(0.4))
                    }
                    
                    Divider()
                        .background(Color.white.opacity(0.1))
                        .padding(.horizontal, 40)
                    
                    HStack(spacing: 40) {
                        VStack(spacing: 2) {
                            Text("DURATION")
                                .zenFont(activeFont, size: 8, weight: .semibold)
                                .foregroundColor(.white.opacity(0.4))
                            Text("\"\(Int(session.durationInMinutes)) mins\"")
                                .zenFont(activeFont, size: 13, weight: .light)
                                .foregroundColor(.white.opacity(0.9))
                        }
                        
                        VStack(spacing: 2) {
                            Text("DATE")
                                .zenFont(activeFont, size: 8, weight: .semibold)
                                .foregroundColor(.white.opacity(0.4))
                            Text(session.date.formatted(date: .abbreviated, time: .omitted))
                                .zenFont(activeFont, size: 13, weight: .light)
                                .foregroundColor(.white.opacity(0.9))
                        }
                    }
                }
                .padding(.vertical, 16)
                .background(Color.black.opacity(0.3))
                .cornerRadius(16)
                .padding(.horizontal, 24)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        .padding(.horizontal, 24)
                )
                
                Text("\"\(innerSelfDepthLabel(for: depth))\"")
                    .zenFont(activeFont, size: 11, isItalic: true)
                    .foregroundColor(.white.opacity(0.65))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 28)
                    .lineLimit(3)
                    .frame(height: 52, alignment: .center)
                
                Spacer(minLength: 0)
                
                HStack(spacing: 4) {
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 8))
                        .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                    Text("Grounded and Present")
                        .zenFont(activeFont, size: 9, weight: .light)
                        .foregroundColor(.white.opacity(0.4))
                }
                .padding(.bottom, 20)
            }
        }
        .frame(width: 420, height: 420)
        .background(activePalette.backgroundGradient)
        .clipped()
    }
    
    private func patanjaliLimbName(for level: Int) -> String {
        switch level {
        case 1: return "YAMA"
        case 2: return "NIYAMA"
        case 3: return "ASANA"
        case 4: return "PRANAYAMA"
        case 5: return "PRATYAHARA"
        case 6: return "DHARANA"
        case 7: return "DHYANA"
        case 8: return "SAMADHI"
        default: return ""
        }
    }
    
    private func innerSelfDepthLabel(for level: Int) -> String {
        switch level {
        case 1: return "Experienced a baseline of total social ease, feeling your heart empty of grudges and filled with kindness for all."
        case 2: return "Touched a state of pure contentment and inner clarity; feeling balanced, clean, and beautifully ready for silence."
        case 3: return "Settled into a perfectly still and easy posture, where your physical presence felt light, steady, and weightless."
        case 4: return "Your physiological baseline and internal life-force slowed down wonderfully, bringing the nervous system to total ease."
        case 5: return "Profound sensory withdrawal, where the external world faded away completely into a quiet, warm inner space."
        case 6: return "Achieved absolute laser-focus, your mind resting perfectly on your chosen technique or focal point without drifting."
        case 7: return "Entered a deep, effortless meditative flow where attention streamed automatically like an unbroken river of peace."
        case 8: return "Touched absolute oneness, where individual boundaries completely melted away into immense, timeless spaciousness."
        default: return ""
        }
    }
}

struct HowItWorksView: View {
    let activeFont: AppFontProfile
    var onClose: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Text("How MyZen Works")
                    .zenFont(activeFont, size: 20, weight: .light)
                    .foregroundColor(.white)
                Spacer()
                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.white.opacity(0.6))
                        .font(.title3)
                }
            }
            
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 6) {
                            Image(systemName: "ruler.fill")
                                .font(.system(size: 14))
                                .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                            Text("A Simple Ruler for Your Mind")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                        }
                        
                        Text("If you want to check your height or measure a room, you use a physical tape measure. The ruler maps space into clean numbers.\n\nBut how do you measure inner quietness? Patanjali's ancient 8 Limbs of Yoga works as an elegant 'ruler' for your attention. Instead of tracking partial efforts, MyZen asks for the single highest point of stillness you achieved—even if it was only reached for a brief, transcendent moment.")
                            .font(.system(size: 11))
                            .foregroundColor(.white.opacity(0.85))
                            .lineSpacing(3)
                    }
                    .padding(12)
                    .background(Color.white.opacity(0.04))
                    .cornerRadius(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.white.opacity(0.06), lineWidth: 1)
                    )
                    
                    VStack(alignment: .leading, spacing: 10) {
                        Text("The 8 Stages of Mindful Depth")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("MyZen turns these qualitative shifts into a peak score from 1 to 8, celebrating your highest threshold of calm:")
                            .font(.system(size: 11))
                            .foregroundColor(.white.opacity(0.7))
                        
                        VStack(spacing: 8) {
                            LimbRow(num: "1-3", title: "Body Calm (Yama, Niyama, Asana)", desc: "Sitting comfortably, letting go of daily stress, and resting in an easy posture.")
                            LimbRow(num: "4", title: "Soft Breathing (Pranayama)", desc: "Slowing down internal physiological rhythms to signal complete physical safety.")
                            LimbRow(num: "5", title: "Noise-Canceling (Pratyahara)", desc: "Unplugging your senses so background sounds and feelings begin to gently fade away.")
                            LimbRow(num: "6", title: "Laser Focus (Dharana)", desc: "Focusing clearly on your chosen meditation technique with steady concentration.")
                            LimbRow(num: "7", title: "Effortless Flow (Dhyana)", desc: "Focus becomes automatic. Your mind flows quietly and calmly like a peaceful river.")
                            LimbRow(num: "8", title: "Complete Oneness (Samadhi)", desc: "A state of pure peace where the boundary between 'you' and the meditation dissolves.")
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Meeting You Exactly Where You Are")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                        
                        Text("A vital secret of meditation: these 8 stages are not a ladder where you must climb stage-by-stage. They are limbs of a single tree, growing together.\n\nEven on a busy or chaotic day, turning inwards for a few minutes and touching a fleeting second of deep focus counts significantly. Simply showing up for yourself nourishes your entire mind!")
                            .font(.system(size: 11))
                            .foregroundColor(.white.opacity(0.85))
                            .lineSpacing(3)
                    }
                    .padding(12)
                    .background(Color(red: 0.35, green: 0.62, blue: 0.60).opacity(0.08))
                    .cornerRadius(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color(red: 0.35, green: 0.62, blue: 0.60).opacity(0.3), lineWidth: 1)
                    )
                }
            }
            .frame(maxHeight: 380)
        }
        .padding(20)
        .background(Color(red: 0.08, green: 0.1, blue: 0.12))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
}

struct LimbRow: View {
    let num: String
    let title: String
    let desc: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Text(num)
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                .frame(width: 24, height: 18)
                .background(Color.white.opacity(0.05))
                .cornerRadius(4)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white.opacity(0.95))
                Text(desc)
                    .font(.system(size: 10))
                    .foregroundColor(.white.opacity(0.5))
                    .lineSpacing(2)
            }
        }
    }
}

struct LogSessionView: View {
    @Environment(\.dismiss) var dismiss
    let activeFont: AppFontProfile
    let activePalette: AmbientPalette
    
    @State private var minutes: Double
    @State private var selectedStage: Int
    
    @State private var showPatanjaliGuide: Bool = false
    @State private var showCustomDuration: Bool = false
    
    @State private var customHrs: String = "0"
    @State private var customMins: String = "15"
    
    var onSave: (Double, [Int]) -> Void
    
    private let selectionGridColumns = [
        GridItem(.flexible(), spacing: 10),
        GridItem(.flexible(), spacing: 10)
    ]
    
    init(activeFont: AppFontProfile, activePalette: AmbientPalette, initialMinutes: Double? = nil, initialPath: [Int]? = nil, onSave: @escaping (Double, [Int]) -> Void) {
        self.activeFont = activeFont
        self.activePalette = activePalette
        self.onSave = onSave
        
        let minVal = initialMinutes ?? 15.0
        _minutes = State(initialValue: minVal)
        
        let path = initialPath ?? []
        let peak = path.max() ?? 4
        
        _selectedStage = State(initialValue: max(1, min(8, peak)))
        
        let initialHrs = Int(minVal) / 60
        let initialMins = Int(minVal) % 60
        _customHrs = State(initialValue: String(initialHrs))
        _customMins = State(initialValue: String(initialMins))
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                LinearGradient(gradient: activePalette.backgroundGradient, startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()
                
                VStack(spacing: 12) {
                    VStack(spacing: 4) {
                        HStack {
                            Text("Duration")
                                .zenFont(activeFont, size: 13)
                                .foregroundColor(.white.opacity(0.5))
                            
                            Spacer()
                            
                            Button(action: {
                                showCustomDuration = true
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "clock.badge")
                                        .font(.system(size: 11))
                                    Text("Custom...")
                                        .zenFont(activeFont, size: 12)
                                }
                                .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                            }
                        }
                        
                        HStack(spacing: 12) {
                            Slider(value: $minutes, in: 5...120, step: 5)
                                .tint(Color(red: 0.35, green: 0.62, blue: 0.60))
                            
                            Text("\"\(Int(minutes)) m\"")
                                .zenFont(activeFont, size: 15, weight: .semibold)
                                .foregroundColor(.white.opacity(0.95))
                                .frame(width: 50, alignment: .trailing)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.04))
                    .cornerRadius(12)
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
                    
                    VStack(spacing: 6) {
                        VStack(spacing: 3) {
                            Text("Select Highest Internal Depth Reached")
                                .zenFont(activeFont, size: 12, weight: .bold)
                                .tracking(0.5)
                                .foregroundColor(.white.opacity(0.5))
                            
                            Button(action: { showPatanjaliGuide = true }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "info.circle.fill")
                                        .font(.system(size: 11))
                                    Text("What is it?")
                                        .zenFont(activeFont, size: 11, weight: .medium)
                                }
                                .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                                .padding(.vertical, 2)
                            }
                        }
                        .padding(.bottom, 2)
                        
                        LazyVGrid(columns: selectionGridColumns, spacing: 8) {
                            ForEach(1...8, id: \.self) { limb in
                                let isSelected = selectedStage == limb
                                
                                Button(action: {
                                    withAnimation(.spring(response: 0.25, dampingFraction: 0.75)) {
                                        selectedStage = limb
                                    }
                                }) {
                                    HStack(spacing: 8) {
                                        Text("\(limb)")
                                            .font(.system(size: 14, weight: .bold))
                                            .frame(width: 24, height: 24)
                                            .background(isSelected ? Color.white.opacity(0.2) : Color.white.opacity(0.05))
                                            .clipShape(Circle())
                                        
                                        VStack(alignment: .leading, spacing: 1) {
                                            Text(patanjaliLimbName(for: limb))
                                                .zenFont(activeFont, size: 14, weight: .bold)
                                            Text(patanjaliShortDesc(for: limb))
                                                .font(.system(size: 9))
                                                .foregroundColor(.white.opacity(0.45))
                                                .lineLimit(1)
                                        }
                                        Spacer()
                                    }
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 14)
                                    .background(isSelected ? Color(red: 0.35, green: 0.62, blue: 0.60).opacity(0.3) : Color.white.opacity(0.03))
                                    .foregroundColor(.white.opacity(0.85))
                                    .cornerRadius(10)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .stroke(isSelected ? Color(red: 0.35, green: 0.62, blue: 0.60).opacity(0.7) : Color.white.opacity(0.05), lineWidth: 1)
                                    )
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                    
                    VStack(spacing: 8) {
                        HStack {
                            VStack(alignment: .leading, spacing: 1) {
                                Text("MAXIMUM DEPTH ACHIEVED")
                                    .font(.system(size: 8, weight: .bold))
                                    .tracking(1.0)
                                    .foregroundColor(.white.opacity(0.4))
                                Text("STAGE \(selectedStage): \(patanjaliLimbName(for: selectedStage))")
                                    .zenFont(activeFont, size: 13, weight: .bold)
                                    .foregroundColor(.white.opacity(0.9))
                            }
                            Spacer()
                        }
                        .padding(.horizontal, 12)
                        .padding(.top, 10)
                        
                        Divider()
                            .background(Color.white.opacity(0.06))
                        
                        HStack(alignment: .top, spacing: 8) {
                            Text(innerSelfDepthLabel(for: selectedStage))
                                .zenFont(activeFont, size: 11, isItalic: true)
                                .foregroundColor(.white.opacity(0.6))
                                .multilineTextAlignment(.leading)
                                .lineLimit(nil)
                                .fixedSize(horizontal: false, vertical: true)
                            
                            Spacer()
                        }
                        .padding(.horizontal, 12)
                        .padding(.bottom, 10)
                    }
                    .background(Color.white.opacity(0.04))
                    .cornerRadius(12)
                    .padding(.horizontal, 16)
                    
                    Spacer()
                    
                    Button(action: {
                        let finalPath = computePath(targetScore: selectedStage)
                        onSave(minutes, finalPath)
                        dismiss()
                    }) {
                        Text("Commit to Journal")
                            .zenFont(activeFont, size: 15, weight: .medium)
                            .foregroundColor(.white.opacity(0.9))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(red: 0.35, green: 0.62, blue: 0.60).opacity(0.85))
                            .cornerRadius(12)
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
                }
                
                if showPatanjaliGuide {
                    Color.black.opacity(0.8)
                        .ignoresSafeArea()
                        .onTapGesture { showPatanjaliGuide = false }
                    
                    VStack(spacing: 16) {
                        HStack {
                            Text("Patanjali's 8 Limbs & Depth")
                                .zenFont(activeFont, size: 18, weight: .bold)
                                .foregroundColor(.white)
                            Spacer()
                            Button(action: { showPatanjaliGuide = false }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.white.opacity(0.6))
                                    .font(.title3)
                            }
                        }
                        
                        ScrollView {
                            VStack(alignment: .leading, spacing: 12) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("How We Measure Mental Peace")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                                    Text("Patanjali's ancient Yoga Sutras introduce an elegant eightfold system (Ashtanga) mapping mental progress. Here, we utilize it as an internal 'measuring tape' to capture the peak experience of your practice.\n\nRather than forcing yourself into continuous perfection, we log the highest threshold of clarity you touched during your session, making it easy and encouraging to chart your journey.")
                                        .font(.system(size: 11))
                                        .foregroundColor(.white.opacity(0.75))
                                        .lineSpacing(3)
                                }
                                .padding(10)
                                .background(Color.white.opacity(0.06))
                                .cornerRadius(8)
                                
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Growth is Connected, Not a Rigid Ladder")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                                    Text("A reassuring secret of this ancient guide: these stages are called 'limbs' (Angas) of a single body, not sequential stairs on a ladder. You do NOT have to perfectly master physical posture or ethical guidelines before you can enjoy deep internal flow.\n\nEven on a busy, noisy, and chaotic day, any practitioner can take a few moments to realign. Any brief instant where focus crystallizes nourishes your entire mindfulness timeline!")
                                        .font(.system(size: 11))
                                        .foregroundColor(.white.opacity(0.75))
                                        .lineSpacing(3)
                                }
                                .padding(10)
                                .background(Color(red: 0.1, green: 0.12, blue: 0.15))
                                .cornerRadius(8)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color(red: 0.35, green: 0.62, blue: 0.60).opacity(0.3), lineWidth: 1)
                                )
                                
                                ForEach(1...8, id: \.self) { limb in
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Limb \(limb): \(patanjaliLimbName(for: limb))")
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(Color(red: 0.45, green: 0.72, blue: 0.70))
                                        Text(patanjaliShortDesc(for: limb))
                                            .font(.system(size: 11, weight: .semibold))
                                            .foregroundColor(.white.opacity(0.9))
                                        Text(patanjaliLongDesc(for: limb))
                                            .font(.system(size: 10))
                                            .foregroundColor(.white.opacity(0.5))
                                    }
                                    .padding(10)
                                    .background(Color.white.opacity(0.04))
                                    .cornerRadius(8)
                                }
                            }
                        }
                        .frame(maxHeight: 340)
                    }
                    .padding(20)
                    .background(Color(red: 0.08, green: 0.1, blue: 0.12))
                    .cornerRadius(16)
                    .padding(.horizontal, 24)
                    .transition(.scale.combined(with: .opacity))
                    .zIndex(10)
                }
                
                if showCustomDuration {
                    Color.black.opacity(0.8)
                        .ignoresSafeArea()
                    
                    VStack(spacing: 18) {
                        Text("Enter Custom Duration")
                            .zenFont(activeFont, size: 16, weight: .bold)
                            .foregroundColor(.white)
                        
                        HStack(spacing: 16) {
                            VStack(alignment: .center, spacing: 4) {
                                Text("HOURS")
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.4))
                                TextField("0", text: $customHrs)
                                    .keyboardType(.numberPad)
                                    .multilineTextAlignment(.center)
                                    .font(.system(size: 20, weight: .bold))
                                    .frame(width: 60, height: 40)
                                    .background(Color.white.opacity(0.06))
                                    .cornerRadius(8)
                                    .foregroundColor(.white)
                            }
                            
                            Text(":")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                                .offset(y: 8)
                            
                            VStack(alignment: .center, spacing: 4) {
                                Text("MINUTES")
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.4))
                                TextField("15", text: $customMins)
                                    .keyboardType(.numberPad)
                                    .multilineTextAlignment(.center)
                                    .font(.system(size: 20, weight: .bold))
                                    .frame(width: 60, height: 40)
                                    .background(Color.white.opacity(0.06))
                                    .cornerRadius(8)
                                    .foregroundColor(.white)
                            }
                        }
                        
                        HStack(spacing: 12) {
                            Button(action: {
                                showCustomDuration = false
                            }) {
                                Text("Cancel")
                                    .font(.system(size: 14))
                                    .foregroundColor(.white.opacity(0.6))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(8)
                            }
                            
                            Button(action: {
                                let hrs = Double(customHrs) ?? 0.0
                                let mins = Double(customMins) ?? 0.0
                                let totalMinutes = (hrs * 60.0) + mins
                                if totalMinutes >= 1 {
                                    self.minutes = min(720, max(1, totalMinutes))
                                }
                                showCustomDuration = false
                            }) {
                                Text("Apply")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color(red: 0.35, green: 0.62, blue: 0.60))
                                    .cornerRadius(8)
                            }
                        }
                    }
                    .padding(20)
                    .background(Color(red: 0.08, green: 0.1, blue: 0.12))
                    .cornerRadius(16)
                    .frame(width: 260)
                    .transition(.scale)
                    .zIndex(11)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .zenFont(activeFont, size: 15)
                        .foregroundColor(.white.opacity(0.5))
                }
            }
        }
    }
    
    private func computePath(targetScore: Int) -> [Int] {
        var path: [Int] = []
        if targetScore >= 1 {
            for i in 1...targetScore {
                path.append(i)
            }
        }
        return path
    }
    
    private func patanjaliLimbName(for level: Int) -> String {
        switch level {
        case 1: return "YAMA"
        case 2: return "NIYAMA"
        case 3: return "ASANA"
        case 4: return "PRANAYAMA"
        case 5: return "PRATYAHARA"
        case 6: return "DHARANA"
        case 7: return "DHYANA"
        case 8: return "SAMADHI"
        default: return ""
        }
    }
    
    private func patanjaliShortDesc(for level: Int) -> String {
        switch level {
        case 1: return "Ethical Restraints"
        case 2: return "Inner Disciplines"
        case 3: return "Steady Posture"
        case 4: return "Breath Integration"
        case 5: return "Sensory Withdrawal"
        case 6: return "One-Pointed Focus"
        case 7: return "Effortless Flow"
        case 8: return "Pure Oneness"
        default: return ""
        }
    }
    
    private func patanjaliLongDesc(for level: Int) -> String {
        switch level {
        case 1: return "YAMA: Harmonizing external relationships—practicing non-violence, truthfulness, and kindness to build a peaceful mental baseline."
        case 2: return "NIYAMA: Personal habits and contentment—cultivating gratitude, cleanliness, and self-reflection to prepare your mind for quietness."
        case 3: return "ASANA: Comfortable physical posture—settling into a steady seat designed to keep your body effortless so it doesn't distract you."
        case 4: return "PRANAYAMA: Regulating vital life-force—slowing down breathing patterns to completely calm and balance your nervous system."
        case 5: return "PRATYAHARA: Withdrawal of sensory inputs—letting go of external noises, sights, and feelings so you can comfortably rest inside."
        case 6: return "DHARANA: One-pointed concentration—gently anchoring your focus on a single object or technique to stabilize wandering thoughts."
        case 7: return "DHYANA: Effortless flow—meditative flow where your attention streams automatically and continuously without any active struggle."
        case 8: return "SAMADHI: Absolute oneness—complete absorption where individual boundaries dissolve into a sense of deep, timeless peace."
        default: return ""
        }
    }
    
    private func innerSelfDepthLabel(for level: Int) -> String {
        switch level {
        case 1: return "Experienced a baseline of total social ease, feeling your heart empty of grudges and filled with kindness for all."
        case 2: return "Touched a state of pure contentment and inner clarity; feeling balanced, clean, and beautifully ready for silence."
        case 3: return "Settled into a perfectly still and easy posture, where your physical presence felt light, steady, and weightless."
        case 4: return "Your physiological baseline and internal life-force slowed down wonderfully, bringing the nervous system to total ease."
        case 5: return "Profound sensory withdrawal, where the external world faded away completely into a quiet, warm inner space."
        case 6: return "Achieved absolute laser-focus, your mind resting perfectly on your chosen technique or focal point without drifting."
        case 7: return "Entered a deep, effortless meditative flow where attention streamed automatically like an unbroken river of peace."
        case 8: return "Touched absolute oneness, where individual boundaries completely melted away into immense, timeless spaciousness."
        default: return ""
        }
    }
}

#Preview {
    ContentView()
}
