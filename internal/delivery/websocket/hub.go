package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	rooms      map[string]map[*Client]bool
	mu         sync.RWMutex
}

type Client struct {
	hub    *Hub
	conn   interface{}
	send   chan []byte
	pollID string
}

type Message struct {
	Type      string      `json:"type"`
	PollID    string      `json:"poll_id"`
	Data      interface{} `json:"data"`
	Timestamp int64       `json:"timestamp"`
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			if h.rooms[client.pollID] == nil {
				h.rooms[client.pollID] = make(map[*Client]bool)
			}
			h.rooms[client.pollID][client] = true
			h.mu.Unlock()
			log.Printf("Client connected to poll: %s", client.pollID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				delete(h.rooms[client.pollID], client)
				close(client.send)
				if len(h.rooms[client.pollID]) == 0 {
					delete(h.rooms, client.pollID)
				}
			}
			h.mu.Unlock()
			log.Printf("Client disconnected from poll: %s", client.pollID)

		case message := <-h.broadcast:
			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Error unmarshaling message: %v", err)
				continue
			}

			h.mu.RLock()
			clients := h.rooms[msg.PollID]
			h.mu.RUnlock()

			for client := range clients {
				select {
				case client.send <- message:
				default:
					h.mu.Lock()
					delete(h.clients, client)
					delete(h.rooms[msg.PollID], client)
					close(client.send)
					h.mu.Unlock()
				}
			}
		}
	}
}

func (h *Hub) BroadcastVoteUpdate(pollID uuid.UUID, data interface{}) {
	msg := Message{
		Type:      "vote_update",
		PollID:    pollID.String(),
		Data:      data,
		Timestamp: nowUnix(),
	}

	msgBytes, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling vote update: %v", err)
		return
	}

	h.broadcast <- msgBytes
}

func nowUnix() int64 {
	return time.Now().Unix()
}