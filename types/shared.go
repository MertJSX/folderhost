package types

type Shared struct {
	ID            string `json:"id"`
	Username      string `json:"username"`
	UserID        int    `json:"userID"`
	DisplayName   string `json:"displayName"`
	Path          string `json:"path"`
	Password      string `json:"password"`
	ExpiresAt     string `json:"expires_at"`
	DownloadCount int    `json:"downloadCount"`
	FileExtension string `json:"fileExtension"`
	CreatedAt     string `json:"created_at"`
}
