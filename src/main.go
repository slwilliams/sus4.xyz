package main

import (
  "log"
  "net/http"
)

func main() {
  fs := http.FileServer(http.Dir("assets"))
  http.Handle("/assets", fs)
  http.HandleFunc("/", func (w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "index.html")
  })

  log.Println("Listening...")
  http.ListenAndServe(":1337", nil)
}