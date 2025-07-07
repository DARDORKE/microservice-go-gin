package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skip2/go-qrcode"
)

type QRHandler struct {
	baseURL string
}

func NewQRHandler(baseURL string) *QRHandler {
	return &QRHandler{
		baseURL: baseURL,
	}
}

// GenerateQRCode godoc
// @Summary Generate QR code for poll
// @Description Generate QR code that links to the poll
// @Tags polls
// @Produce png
// @Param id path string true "Poll ID"
// @Success 200 {file} png
// @Failure 400 {object} map[string]string
// @Router /api/v1/polls/{id}/qr [get]
func (h *QRHandler) GenerateQRCode(c *gin.Context) {
	pollIDStr := c.Param("id")
	pollID, err := uuid.Parse(pollIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll ID"})
		return
	}

	pollURL := h.baseURL + "/poll/" + pollID.String()

	qr, err := qrcode.New(pollURL, qrcode.Medium)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate QR code"})
		return
	}

	png, err := qr.PNG(256)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate QR code image"})
		return
	}

	c.Data(http.StatusOK, "image/png", png)
}