package types

type Shared struct {
	ID            string `json:"id"`
	Username      string `json:"username"`
	UserID        int    `json:"userID"`
	DisplayName   string `json:"displayName"`
	Path          string `json:"path"`
	Password      string `json:"password"`
	DownloadLimit int    `json:"downloadLimit"`
	DownloadCount int    `json:"downloadCount"`
	Public        bool   `json:"public"`
	CreatedAt     string `json:"created_at"`
}
