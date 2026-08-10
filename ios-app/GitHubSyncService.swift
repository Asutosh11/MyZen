import Foundation

class GitHubSyncService {
    private let githubUsername = "Asutosh11"
    private let repoName = "MyZen"
    private let filePath = "sessions.json"
    private let accessToken = "<add yours>"
    
    struct GitHubContentResponse: Codable {
        let sha: String
        let content: String?
    }
    
    /// Pulls sessions.json from the GitHub repo. Used as a fallback when
    /// there's no local UserDefaults data (e.g. fresh install, reinstall,
    /// or a new device that hasn't received a sync from the iOS app yet).
    func fetchSessionsFromCloud(completion: @escaping ([MeditationSession]?) -> Void) {
        let urlString = "https://api.github.com/repos/\(githubUsername)/\(repoName)/contents/\(filePath)"
        guard let url = URL(string: urlString) else {
            completion(nil)
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data,
                  let decoded = try? JSONDecoder().decode(GitHubContentResponse.self, from: data),
                  let base64Content = decoded.content else {
                // File doesn't exist yet, network failure, or bad response
                DispatchQueue.main.async { completion(nil) }
                return
            }
            
            // GitHub's API returns base64 content with embedded newlines every 60
            // chars, which Data(base64Encoded:) chokes on unless stripped first.
            let cleanedBase64 = base64Content.replacingOccurrences(of: "\n", with: "")
            
            guard let jsonData = Data(base64Encoded: cleanedBase64),
                  let sessions = try? JSONDecoder().decode([MeditationSession].self, from: jsonData) else {
                DispatchQueue.main.async { completion(nil) }
                return
            }
            
            DispatchQueue.main.async {
                completion(sessions)
            }
        }.resume()
    }
    
    func syncSessionsToCloud(sessions: [MeditationSession]) {
        guard let jsonData = try? JSONEncoder().encode(sessions),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            print("Failed to encode sessions")
            return
        }
        
        // 1. We must first get the "SHA" hash of the existing file if it exists,
        // because GitHub requires the current file's SHA to let you overwrite it.
        getFileSHA { [weak self] currentSHA in
            self?.uploadToGitHub(content: jsonString, sha: currentSHA)
        }
    }
    
    private func getFileSHA(completion: @escaping (String?) -> Void) {
        let urlString = "https://api.github.com/repos/\(githubUsername)/\(repoName)/contents/\(filePath)"
        guard let url = URL(string: urlString) else { completion(nil); return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        
        URLSession.shared.dataTask(with: request) { data, response, _ in
            guard let data = data,
                  let decoded = try? JSONDecoder().decode(GitHubContentResponse.self, from: data) else {
                completion(nil) // File doesn't exist yet
                return
            }
            completion(decoded.sha)
        }.resume()
    }
    
    private func uploadToGitHub(content: String, sha: String?) {
        let urlString = "https://api.github.com/repos/\(githubUsername)/\(repoName)/contents/\(filePath)"
        guard let url = URL(string: urlString) else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        
        // GitHub API expects the text content to be Base64 encoded
        guard let textData = content.data(using: .utf8) else { return }
        let base64Content = textData.base64EncodedString()
        
        var body: [String: Any] = [
            "message": "Update meditation journal entries via MyZen App",
            "content": base64Content
        ]
        
        if let sha = sha {
            body["sha"] = sha // Include the current hash if overwriting
        }
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let httpResponse = response as? HTTPURLResponse {
                if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                    print("Successfully synced text file data to GitHub cloud.")
                } else {
                    print("GitHub upload failed with status code: \(httpResponse.statusCode)")
                }
            }
        }.resume()
    }
}
