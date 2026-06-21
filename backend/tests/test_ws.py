def test_ws_prices_sends_connected_ack(client):
    with client.websocket_connect("/ws/prices") as ws:
        message = ws.receive_json()
        assert message["type"] == "connected"
