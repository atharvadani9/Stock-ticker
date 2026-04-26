package handlers

import (
	"net/http"

	"github.com/atharvadani9/stock-ticker/backend/models"
	"github.com/atharvadani9/stock-ticker/backend/store"
	"github.com/gin-gonic/gin"
)

func GetTable(c *gin.Context) {
	c.JSON(http.StatusOK, store.GetTable())
}

func PutTable(c *gin.Context) {
	var s models.TableState
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, store.PutTable(s))
}
