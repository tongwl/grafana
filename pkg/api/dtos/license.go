package dtos

type LicenseInput struct {
	Key string `json:"授权码" binding:"Required"`
}
