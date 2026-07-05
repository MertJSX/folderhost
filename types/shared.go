package types

type Shared struct {
	ID            int    `json:"id"`
	Username      string `json:"username"`
	UserID        int    `json:"userID"`
	Path          string `json:"path"`
	Password      string `json:"password"`
	DownloadLimit int    `json:"downloadLimit"`
	DownloadCount int    `json:"downloadCount"`
	Public        bool   `json:"public"`
	CreatedAt     string `json:"created_at"`
}
