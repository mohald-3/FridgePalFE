import {
  createProduct,
  deleteProduct as deleteProductApi,
  getProducts,
  updateProduct as updateProductApi,
} from '@/services/productApi';
import { CreateProductRequest, ProductDisplay } from '@/types/interfaces';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface ProductContextValue {
  products: ProductDisplay[];
  fetchProducts: () => Promise<void>;
  addProduct: (
    productData: CreateProductRequest,
    imageUri?: string | null
  ) => Promise<void>;
  updateProduct: (
    itemId: string,
    updatedData: Partial<CreateProductRequest>
  ) => Promise<void>;
  deleteProduct: (itemId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const ProductContext = createContext<ProductContextValue | undefined>(
  undefined
);

export default function ProductProvider({ children }: PropsWithChildren) {
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('[ProductContext] fetchProducts error:', error);
      setError('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = useCallback(
    async (productData: CreateProductRequest, imageUri?: string | null) => {
      try {
        setLoading(true);
        setError(null);
        await createProduct(productData, imageUri);
        await fetchProducts();
      } catch (error) {
        console.error('[ProductContext] addProduct error:', error);
        setError('Failed to add product. Please try again.');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchProducts]
  );

  const updateProduct = useCallback(
    async (itemId: string, updatedData: Partial<CreateProductRequest>) => {
      try {
        setLoading(true);
        setError(null);
        await updateProductApi(itemId, updatedData);

        const refreshedProducts = await getProducts();
        setProducts(refreshedProducts);
      } catch (error) {
        console.error('[ProductContext] updateProduct error:', error);
        setError('Failed to update product.');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteProduct = useCallback(async (itemId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteProductApi(itemId);

      setProducts((prev) =>
        prev.filter((product) => product.itemId !== itemId)
      );
    } catch (error) {
      console.error('[ProductContext] deleteProduct error:', error);
      setError('Failed to delete product. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const contextValue = useMemo(
    () => ({
      products,
      addProduct,
      fetchProducts,
      updateProduct,
      deleteProduct,
      loading,
      error,
    }),
    [
      products,
      addProduct,
      fetchProducts,
      updateProduct,
      deleteProduct,
      loading,
      error,
    ]
  );

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = (): ProductContextValue => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
