"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Package,
  Search,
  Plus,
  Edit,
  Minus,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export default function InventoryPage() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeductDialogOpen, setIsDeductDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [newItem, setNewItem] = useState({
    itemName: "",
    category: "general",
    quantity: 0,
    minStock: 10,
    unit: "ea",
  });

  const [deductAmount, setDeductAmount] = useState(1);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchQuery]);

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/pharmacist/inventory");
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort by low stock first
    filtered.sort((a, b) => {
      const aLowStock = a.quantity <= a.minStock;
      const bLowStock = b.quantity <= b.minStock;
      if (aLowStock && !bLowStock) return -1;
      if (!aLowStock && bLowStock) return 1;
      return a.itemName.localeCompare(b.itemName);
    });

    setFilteredInventory(filtered);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const response = await fetch("/api/pharmacist/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) throw new Error("Failed to add item");

      toast({
        title: "Success",
        description: "Item added to inventory",
      });

      setIsAddDialogOpen(false);
      setNewItem({
        itemName: "",
        category: "general",
        quantity: 0,
        minStock: 10,
        unit: "ea",
      });
      await fetchInventory();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeduct = async () => {
    if (!selectedItem) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/pharmacist/inventory/${selectedItem.id}/deduct`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: deductAmount }),
        },
      );

      if (!response.ok) throw new Error("Failed to deduct stock");

      toast({
        title: "Success",
        description: `Deducted ${deductAmount} ${selectedItem.unit} from ${selectedItem.itemName}`,
      });

      setIsDeductDialogOpen(false);
      setSelectedItem(null);
      setDeductAmount(1);
      await fetchInventory();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deduct stock",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return {
        label: "Out of Stock",
        color: "bg-red-100 text-red-800",
        icon: AlertTriangle,
      };
    }
    if (item.quantity <= item.minStock) {
      return {
        label: "Low Stock",
        color: "bg-amber-100 text-amber-800",
        icon: TrendingDown,
      };
    }
    return {
      label: "In Stock",
      color: "bg-green-100 text-green-800",
      icon: Package,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Inventory Management
            </h1>
            <p className="text-slate-600 text-lg mt-1">
              Track and manage medication stock levels
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Add a new medication to inventory
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={newItem.itemName}
                    onChange={(e) =>
                      setNewItem({ ...newItem, itemName: e.target.value })
                    }
                    placeholder="e.g., Paracetamol 500mg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({ ...newItem, category: e.target.value })
                    }
                    placeholder="e.g., Analgesic"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Initial Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          quantity: Number(e.target.value),
                        })
                      }
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minStock">Min Stock Level</Label>
                    <Input
                      id="minStock"
                      type="number"
                      value={newItem.minStock}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          minStock: Number(e.target.value),
                        })
                      }
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unit: e.target.value })
                    }
                    placeholder="e.g., tablets, bottles, boxes"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full"
                >
                  {actionLoading ? "Adding..." : "Add Item"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search inventory by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-300"
                />
              </div>
              <div className="mt-4 text-sm text-slate-600">
                Showing {filteredInventory.length} of {inventory.length} items
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Inventory List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonShinyGradient
                  key={i}
                  className="h-48 rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : filteredInventory.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No items found</p>
                <p className="text-slate-500 text-sm mt-2">
                  Try adjusting your search or add a new item
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item, index) => {
                const status = getStockStatus(item);
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`border-slate-200 hover:shadow-lg transition-all duration-300 ${item.quantity <= item.minStock ? "border-l-4 border-l-amber-500" : ""}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-slate-900">
                              {item.itemName}
                            </CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {item.category}
                            </CardDescription>
                          </div>
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Current Stock</p>
                            <p className="text-2xl font-bold text-slate-900">
                              {item.quantity}
                              <span className="text-sm text-slate-500 ml-1">
                                {item.unit}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Min Level</p>
                            <p className="text-2xl font-bold text-slate-900">
                              {item.minStock}
                              <span className="text-sm text-slate-500 ml-1">
                                {item.unit}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Dialog
                            open={
                              isDeductDialogOpen && selectedItem?.id === item.id
                            }
                            onOpenChange={(open) => {
                              setIsDeductDialogOpen(open);
                              if (open) setSelectedItem(item);
                              else {
                                setSelectedItem(null);
                                setDeductAmount(1);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Minus className="w-4 h-4 mr-1" />
                                Deduct
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Deduct Stock</DialogTitle>
                                <DialogDescription>
                                  Remove stock from {item.itemName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="deductAmount">
                                    Amount to Deduct
                                  </Label>
                                  <Input
                                    id="deductAmount"
                                    type="number"
                                    value={deductAmount}
                                    onChange={(e) =>
                                      setDeductAmount(Number(e.target.value))
                                    }
                                    min="1"
                                    max={item.quantity}
                                  />
                                  <p className="text-sm text-slate-500 mt-2">
                                    Available: {item.quantity} {item.unit}
                                  </p>
                                </div>
                                <Button
                                  onClick={handleDeduct}
                                  disabled={
                                    actionLoading ||
                                    deductAmount > item.quantity
                                  }
                                  className="w-full"
                                  variant="destructive"
                                >
                                  {actionLoading
                                    ? "Processing..."
                                    : `Deduct ${deductAmount} ${item.unit}`}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
