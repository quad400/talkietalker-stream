# streamflow-go

Go server SDK for the [StreamFlow](https://streamflow.io) API.

## Install

```bash
go get github.com/streamflow/streamflow-go
```

## Quickstart

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    "github.com/streamflow/streamflow-go/streamflow"
)

func main() {
    client := streamflow.NewClient(os.Getenv("STREAMFLOW_SECRET_KEY"))
    stream, err := client.Streams().Create(context.Background(), &streamflow.CreateStreamParams{
        Title: "Weekly standup",
        Mode:  streamflow.StreamModeRoom,
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("stream:", stream.ID)
}
```

## Options

- `streamflow.WithBaseURL(url)` — self-hosted API
- `streamflow.WithHTTPClient(client)` — custom HTTP client
- `streamflow.WithAccessToken(jwt)` — JWT for project management endpoints
- `streamflow.WithIdempotencyKey(key)` — safe POST retries
