package types

type SSLConfig struct {
	Enabled bool     `yaml:"enabled"`
	Type    string   `yaml:"type"`
	Domains []string `yaml:"domains"`
	Email   string   `yaml:"email"`
}

type ConfigFile struct {
	Version         string `yaml:"version"`
	Port            int    `yaml:"port"`
	Folder          string `yaml:"folder"`
	StorageLimit    string `yaml:"storage_limit"`
	SecretJwtKey    string `yaml:"secret_jwt_key"`
	BirthDate       string `yaml:"birthDate"`
	DateModified    string `yaml:"dateModified"`
	Size            string `yaml:"size"`
	SizeBytes       int64
	AdminAccount    Account `yaml:"admin"`
	RecoveryBin     bool    `yaml:"recovery_bin"`
	BinStorageLimit string  `yaml:"bin_storage_limit"`
	LogActivities   bool    `yaml:"log_activities"`
	ClearLogsAfter  int     `yaml:"clear_logs_after"`
	SSL             SSLConfig `yaml:"ssl"`
}

func (c *ConfigFile) GetScopedFolder(scope string) string {
	// for example: ./host + /mert
	return c.Folder + scope
}
