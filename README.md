# Network Visualiser

A visual representation of a network

## Screen Shot
![Airmon Data Screenshot](generators/aircrack/screenshot.png)

# Generators

## AirCrack NG

The network visualiser can use airodump-ng as it's source of data. This is the preferred generator as it will also show all associated clients

To run the Airodump generator run the following commands in the `generators/aircrack` directory

```bash
node airodump.js <INTERFACE_NAME>
```

- Replace `<INTERFACE_NAME>` with the name of an interface in monitor mode. Most of the time this will be `wlan0mon`
- This must be run as root as it's accessing the device directly

## IW Scan

IW Scan is s simple easier to run data source but it will only show you APs

To run the IW Scan generator run the following commands in the `generators/iwscan` directory

```bash
node iwscan.js <INTERFACE_NAME>
```

- Replace `<INTERFACE_NAME>` with the interface you want to scan.
- It's recommended to run this as root (`sudo node iwscan.js <INTERFACE_NAME>`), while it will still work you wont be able to do an active scan.